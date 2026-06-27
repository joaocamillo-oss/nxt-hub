"use server";

import { revalidatePath } from "next/cache";
import { requireOrgMember, requireOrgRole } from "@/lib/auth/guards";
import { logError } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/types/supabase";
import {
  type CreatePrazoInput,
  createPrazoSchema,
  type DeletePrazoInput,
  deletePrazoSchema,
  type UpdatePrazoInput,
  updatePrazoSchema,
} from "./schemas";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

export async function createPrazoAction(
  input: CreatePrazoInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createPrazoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { user, org } = await requireOrgMember({ orgSlug: parsed.data.orgSlug });
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("prazos")
    .insert({
      organization_id: org.id,
      titulo: parsed.data.titulo,
      tipo: parsed.data.tipo,
      status: parsed.data.status,
      data_prazo: parsed.data.dataPrazo,
      dias_uteis_prazo: parsed.data.diasUteisPrazo ?? null,
      processo_id: parsed.data.processoId ?? null,
      responsavel_id: parsed.data.responsavelId ?? null,
      observacoes: parsed.data.observacoes ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    logError("prazos.create", error);
    return { ok: false, error: "Erro ao criar prazo. Tente novamente." };
  }

  revalidatePath(`/app/${parsed.data.orgSlug}/prazos`);
  if (parsed.data.processoId) {
    revalidatePath(`/app/${parsed.data.orgSlug}/processos/${parsed.data.processoId}`);
  }
  return { ok: true, data: { id: data.id } };
}

export async function updatePrazoAction(input: UpdatePrazoInput): Promise<ActionResult> {
  const parsed = updatePrazoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { org } = await requireOrgMember({ orgSlug: parsed.data.orgSlug });
  const supabase = await createClient();

  const patch: TablesUpdate<"prazos"> = {};
  if (parsed.data.titulo !== undefined) patch.titulo = parsed.data.titulo;
  if (parsed.data.tipo !== undefined) patch.tipo = parsed.data.tipo;
  if (parsed.data.status !== undefined) patch.status = parsed.data.status;
  if (parsed.data.dataPrazo !== undefined) patch.data_prazo = parsed.data.dataPrazo;
  if (parsed.data.diasUteisPrazo !== undefined) patch.dias_uteis_prazo = parsed.data.diasUteisPrazo;
  if (parsed.data.processoId !== undefined) patch.processo_id = parsed.data.processoId;
  if (parsed.data.responsavelId !== undefined) patch.responsavel_id = parsed.data.responsavelId;
  if (parsed.data.observacoes !== undefined) patch.observacoes = parsed.data.observacoes;

  const { error } = await supabase
    .from("prazos")
    .update(patch)
    .eq("id", parsed.data.id)
    .eq("organization_id", org.id);

  if (error) {
    logError("prazos.update", error);
    return { ok: false, error: "Erro ao atualizar prazo. Tente novamente." };
  }

  revalidatePath(`/app/${parsed.data.orgSlug}/prazos`);
  return { ok: true };
}

export async function deletePrazoAction(input: DeletePrazoInput): Promise<ActionResult> {
  const parsed = deletePrazoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos" };
  }

  const { org } = await requireOrgRole({
    orgSlug: parsed.data.orgSlug,
    roles: ["owner", "admin"],
  });
  const supabase = await createClient();

  const { error } = await supabase
    .from("prazos")
    .delete()
    .eq("id", parsed.data.id)
    .eq("organization_id", org.id);

  if (error) {
    logError("prazos.delete", error);
    return { ok: false, error: "Erro ao excluir prazo. Tente novamente." };
  }

  revalidatePath(`/app/${parsed.data.orgSlug}/prazos`);
  return { ok: true };
}
