"use server";

import { revalidatePath } from "next/cache";
import { requireOrgMember } from "@/lib/auth/guards";
import { logError } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/supabase";
import { asaasCreatePayment, asaasGetPixQrCode, mapAsaasStatus } from "@/lib/asaas/client";
import { getAsaasConfig } from "@/lib/asaas/config";
import {
  type CreateHonorarioInput,
  createHonorarioSchema,
  type GerarCobrancaAsaasInput,
  gerarCobrancaAsaasSchema,
  gerarVencimentos,
  type UpdateHonorarioInput,
  updateHonorarioSchema,
  type UpdateParcelaInput,
  updateParcelaSchema,
} from "./schemas";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function createHonorarioAction(
  input: CreateHonorarioInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createHonorarioSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { user, org } = await requireOrgMember({ orgSlug: parsed.data.orgSlug });
  const supabase = await createClient();

  // Criar honorário
  const { data: hon, error: honErr } = await supabase
    .from("honorarios")
    .insert({
      organization_id: org.id,
      processo_id: parsed.data.processoId ?? null,
      contact_id: parsed.data.contactId ?? null,
      tipo: parsed.data.tipo,
      valor_total: parsed.data.valorTotal,
      valor_exito: parsed.data.valorExito ?? null,
      percentual_exito: parsed.data.percentualExito ?? null,
      num_parcelas: parsed.data.numParcelas,
      descricao: parsed.data.descricao ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (honErr || !hon) {
    logError("honorarios.create", honErr);
    return { ok: false, error: "Erro ao criar honorários. Tente novamente." };
  }

  // Gerar parcelas
  const valorParcela = Number(
    (parsed.data.valorTotal / parsed.data.numParcelas).toFixed(2),
  );
  const vencimentos = gerarVencimentos(
    parsed.data.primeiroVencimento,
    parsed.data.numParcelas,
  );

  const parcelasInsert = vencimentos.map((dt, i) => ({
    organization_id: org.id,
    honorario_id: hon.id,
    numero: i + 1,
    valor: valorParcela,
    data_vencimento: dt,
  }));

  const { error: pErr } = await supabase.from("parcelas").insert(parcelasInsert);
  if (pErr) {
    logError("parcelas.create", pErr);
    // Rollback manual (sem transaction em client): apaga o honorário
    await supabase.from("honorarios").delete().eq("id", hon.id);
    return { ok: false, error: "Erro ao gerar parcelas. Tente novamente." };
  }

  revalidatePath(`/app/${parsed.data.orgSlug}/financeiro`);
  return { ok: true, data: { id: hon.id } };
}

export async function updateHonorarioAction(
  input: UpdateHonorarioInput,
): Promise<ActionResult> {
  const parsed = updateHonorarioSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { org } = await requireOrgMember({ orgSlug: parsed.data.orgSlug });
  const supabase = await createClient();

  const patch: TablesUpdate<"honorarios"> = {};
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;
  if (parsed.data.descricao !== undefined) patch.descricao = parsed.data.descricao;

  const { error } = await supabase
    .from("honorarios")
    .update(patch)
    .eq("id", parsed.data.id)
    .eq("organization_id", org.id);

  if (error) {
    logError("honorarios.update", error);
    return { ok: false, error: "Erro ao atualizar. Tente novamente." };
  }

  revalidatePath(`/app/${parsed.data.orgSlug}/financeiro`);
  revalidatePath(`/app/${parsed.data.orgSlug}/financeiro/${parsed.data.id}`);
  return { ok: true };
}

export async function updateParcelaAction(input: UpdateParcelaInput): Promise<ActionResult> {
  const parsed = updateParcelaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { org } = await requireOrgMember({ orgSlug: parsed.data.orgSlug });
  const supabase = await createClient();

  const patch: TablesUpdate<"parcelas"> = {};
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;
  if (parsed.data.metodoPagamento !== undefined)
    patch.metodo_pagamento = parsed.data.metodoPagamento;
  if (parsed.data.dataPagamento !== undefined) patch.data_pagamento = parsed.data.dataPagamento;
  if (parsed.data.valorPago !== undefined) patch.valor_pago = parsed.data.valorPago;

  const { error } = await supabase
    .from("parcelas")
    .update(patch)
    .eq("id", parsed.data.id)
    .eq("organization_id", org.id);

  if (error) {
    logError("parcelas.update", error);
    return { ok: false, error: "Erro ao atualizar parcela. Tente novamente." };
  }

  revalidatePath(`/app/${parsed.data.orgSlug}/financeiro`);
  return { ok: true };
}

/** Gera cobrança no Asaas e salva o payment_id + URL na parcela. */
export async function gerarCobrancaAsaasAction(
  input: GerarCobrancaAsaasInput,
): Promise<ActionResult<{ invoiceUrl?: string; pixCopyPaste?: string }>> {
  const parsed = gerarCobrancaAsaasSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { org } = await requireOrgMember({ orgSlug: parsed.data.orgSlug });
  const supabase = await createClient();

  // Buscar parcela
  const { data: parcela } = await supabase
    .from("parcelas")
    .select("*, honorarios(descricao, numero_cnj:processos(numero_cnj))")
    .eq("id", parsed.data.parcelaId)
    .eq("organization_id", org.id)
    .maybeSingle();

  if (!parcela) return { ok: false, error: "Parcela não encontrada" };
  if (parcela.asaas_payment_id) return { ok: false, error: "Cobrança já gerada para esta parcela" };

  const config = await getAsaasConfig(org.id);
  if (!config) return { ok: false, error: "Asaas não configurado para este escritório" };

  const payment = await asaasCreatePayment(config.environment, config.apiKey, {
    customer: parsed.data.asaasCustomerId,
    billingType: parsed.data.billingType,
    value: Number(parcela.valor),
    dueDate: parcela.data_vencimento,
    description: `Honorários — parcela ${parcela.numero}`,
    externalReference: parcela.id,
  }).catch((e: unknown) => {
    logError("asaas.createPayment", e);
    return null;
  });

  if (!payment) return { ok: false, error: "Erro ao gerar cobrança no Asaas" };

  let pixCopyPaste: string | null = null;
  if (parsed.data.billingType === "PIX") {
    const pix = await asaasGetPixQrCode(
      config.environment,
      config.apiKey,
      payment.id,
    ).catch(() => null);
    pixCopyPaste = pix?.payload ?? null;
  }

  await supabase
    .from("parcelas")
    .update({
      asaas_payment_id: payment.id,
      asaas_invoice_url: payment.invoiceUrl ?? null,
      asaas_pix_copy_paste: pixCopyPaste,
      status: mapAsaasStatus(payment.status),
    })
    .eq("id", parsed.data.parcelaId);

  revalidatePath(`/app/${parsed.data.orgSlug}/financeiro`);
  return {
    ok: true,
    data: {
      invoiceUrl: payment.invoiceUrl,
      pixCopyPaste: pixCopyPaste ?? undefined,
    },
  };
}
