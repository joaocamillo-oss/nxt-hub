"use server";

import { revalidatePath } from "next/cache";
import { requireOrgMember, requireOrgRole } from "@/lib/auth/guards";
import { logError } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/supabase";
import {
  type CreateMovimentacaoInput,
  createMovimentacaoSchema,
  type CreateProcessoInput,
  createProcessoSchema,
  type DeleteProcessoInput,
  deleteProcessoSchema,
  type UpdateProcessoInput,
  updateProcessoSchema,
} from "./schemas";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function createProcessoAction(
  input: CreateProcessoInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createProcessoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { user, org } = await requireOrgMember({ orgSlug: parsed.data.orgSlug });
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("processos")
    .insert({
      organization_id: org.id,
      numero_cnj: parsed.data.numeroCnj,
      tribunal: parsed.data.tribunal,
      vara: parsed.data.vara ?? null,
      comarca: parsed.data.comarca ?? null,
      tipo: parsed.data.tipo,
      fase: parsed.data.fase,
      status: parsed.data.status,
      polo_ativo: parsed.data.poloAtivo,
      polo_passivo: parsed.data.poloPassivo,
      valor_causa: parsed.data.valorCausa ?? null,
      data_distribuicao: parsed.data.dataDistribuicao ?? null,
      contact_id: parsed.data.contactId ?? null,
      responsavel_id: parsed.data.responsavelId ?? null,
      observacoes: parsed.data.observacoes ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    logError("processos.create", error);
    return { ok: false, error: "Erro ao cadastrar processo. Tente novamente." };
  }

  revalidatePath(`/app/${parsed.data.orgSlug}/processos`);
  return { ok: true, data: { id: data.id } };
}

export async function updateProcessoAction(input: UpdateProcessoInput): Promise<ActionResult> {
  const parsed = updateProcessoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { org } = await requireOrgMember({ orgSlug: parsed.data.orgSlug });
  const supabase = await createClient();

  const patch: TablesUpdate<"processos"> = {};
  if (parsed.data.numeroCnj !== undefined) patch.numero_cnj = parsed.data.numeroCnj;
  if (parsed.data.tribunal !== undefined) patch.tribunal = parsed.data.tribunal;
  if (parsed.data.vara !== undefined) patch.vara = parsed.data.vara;
  if (parsed.data.comarca !== undefined) patch.comarca = parsed.data.comarca;
  if (parsed.data.tipo !== undefined) patch.tipo = parsed.data.tipo;
  if (parsed.data.fase !== undefined) patch.fase = parsed.data.fase;
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;
  if (parsed.data.poloAtivo !== undefined) patch.polo_ativo = parsed.data.poloAtivo;
  if (parsed.data.poloPassivo !== undefined) patch.polo_passivo = parsed.data.poloPassivo;
  if (parsed.data.valorCausa !== undefined) patch.valor_causa = parsed.data.valorCausa;
  if (parsed.data.dataDistribuicao !== undefined)
    patch.data_distribuicao = parsed.data.dataDistribuicao;
  if (parsed.data.dataEncerramento !== undefined)
    patch.data_encerramento = parsed.data.dataEncerramento;
  if (parsed.data.contactId !== undefined) patch.contact_id = parsed.data.contactId;
  if (parsed.data.responsavelId !== undefined) patch.responsavel_id = parsed.data.responsavelId;
  if (parsed.data.observacoes !== undefined) patch.observacoes = parsed.data.observacoes;

  const { error } = await supabase
    .from("processos")
    .update(patch)
    .eq("id", parsed.data.id)
    .eq("organization_id", org.id);

  if (error) {
    logError("processos.update", error);
    return { ok: false, error: "Erro ao atualizar processo. Tente novamente." };
  }

  revalidatePath(`/app/${parsed.data.orgSlug}/processos`);
  revalidatePath(`/app/${parsed.data.orgSlug}/processos/${parsed.data.id}`);
  return { ok: true };
}

export async function deleteProcessoAction(input: DeleteProcessoInput): Promise<ActionResult> {
  const parsed = deleteProcessoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos" };
  }

  const { org } = await requireOrgRole({
    orgSlug: parsed.data.orgSlug,
    roles: ["owner", "admin"],
  });
  const supabase = await createClient();

  const { error } = await supabase
    .from("processos")
    .delete()
    .eq("id", parsed.data.id)
    .eq("organization_id", org.id);

  if (error) {
    logError("processos.delete", error);
    return { ok: false, error: "Erro ao excluir processo. Tente novamente." };
  }

  revalidatePath(`/app/${parsed.data.orgSlug}/processos`);
  return { ok: true };
}

export async function createMovimentacaoAction(
  input: CreateMovimentacaoInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createMovimentacaoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { user, org } = await requireOrgMember({ orgSlug: parsed.data.orgSlug });
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("movimentacoes")
    .insert({
      organization_id: org.id,
      processo_id: parsed.data.processoId,
      data_movimentacao: parsed.data.dataMovimentacao,
      descricao: parsed.data.descricao,
      tipo: parsed.data.tipo,
      is_intimacao: parsed.data.isIntimacao,
      prazo_dias: parsed.data.prazoDias ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    logError("movimentacoes.create", error);
    return { ok: false, error: "Erro ao registrar movimentação. Tente novamente." };
  }

  revalidatePath(`/app/${parsed.data.orgSlug}/processos/${parsed.data.processoId}`);
  return { ok: true, data: { id: data.id } };
}
