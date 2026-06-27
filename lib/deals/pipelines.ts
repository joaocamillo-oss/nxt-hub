"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrgMember, requireOrgRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type PipelineRow = Database["public"]["Tables"]["pipelines"]["Row"];

export type Pipeline = PipelineRow & { channelName?: string | null };

export async function getPipelines(orgId: string): Promise<Pipeline[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pipelines")
    .select("*, channel:channels(name)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as (PipelineRow & { channel: { name: string } | null })[]).map(
    ({ channel, ...rest }) => ({ ...rest, channelName: channel?.name ?? null }),
  );
}

export async function getDefaultPipeline(orgId: string): Promise<Pipeline | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pipelines")
    .select("*, channel:channels(name)")
    .eq("organization_id", orgId)
    .eq("is_default", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { channel, ...rest } = data as PipelineRow & { channel: { name: string } | null };
  return { ...rest, channelName: channel?.name ?? null };
}

// ─── Actions ─────────────────────────────────────────────────────────────────

const createPipelineSchema = z.object({
  orgSlug: z.string(),
  name: z.string().min(1).max(100),
  channelId: z.string().uuid().optional(),
  isDefault: z.boolean().optional(),
});

export async function createPipelineAction(input: z.infer<typeof createPipelineSchema>) {
  const parsed = createPipelineSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Dados inválidos" };
  const { orgSlug, name, channelId, isDefault } = parsed.data;

  const { org } = await requireOrgRole({ orgSlug, roles: ["owner", "admin"] });
  const supabase = await createClient();

  if (isDefault) {
    await supabase
      .from("pipelines")
      .update({ is_default: false })
      .eq("organization_id", org.id)
      .eq("is_default", true);
  }

  const { data, error } = await supabase
    .from("pipelines")
    .insert({
      organization_id: org.id,
      name,
      channel_id: channelId ?? null,
      is_default: isDefault ?? false,
    })
    .select()
    .single();

  if (error) {
    console.error("createPipelineAction", error);
    return { ok: false as const, error: "Erro ao criar funil" };
  }
  revalidatePath(`/app/${orgSlug}/deals`);
  return { ok: true as const, data: data as Pipeline };
}

const updatePipelineSchema = z.object({
  orgSlug: z.string(),
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  channelId: z.string().uuid().nullable().optional(),
  isDefault: z.boolean().optional(),
});

export async function updatePipelineAction(input: z.infer<typeof updatePipelineSchema>) {
  const parsed = updatePipelineSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Dados inválidos" };
  const { orgSlug, id, name, channelId, isDefault } = parsed.data;

  const { org } = await requireOrgRole({ orgSlug, roles: ["owner", "admin"] });
  const supabase = await createClient();

  if (isDefault) {
    await supabase
      .from("pipelines")
      .update({ is_default: false })
      .eq("organization_id", org.id)
      .eq("is_default", true)
      .neq("id", id);
  }

  const patch: Database["public"]["Tables"]["pipelines"]["Update"] = {};
  if (name !== undefined) patch.name = name;
  if (channelId !== undefined) patch.channel_id = channelId;
  if (isDefault !== undefined) patch.is_default = isDefault;

  const { error } = await supabase
    .from("pipelines")
    .update(patch)
    .eq("id", id)
    .eq("organization_id", org.id);

  if (error) {
    console.error("updatePipelineAction", error);
    return { ok: false as const, error: "Erro ao atualizar funil" };
  }
  revalidatePath(`/app/${orgSlug}/deals`);
  return { ok: true as const };
}

export async function deletePipelineAction(orgSlug: string, id: string) {
  const { org } = await requireOrgRole({ orgSlug, roles: ["owner", "admin"] });
  const supabase = await createClient();
  const { error } = await supabase
    .from("pipelines")
    .delete()
    .eq("id", id)
    .eq("organization_id", org.id);
  if (error) {
    console.error("deletePipelineAction", error);
    return { ok: false as const, error: "Erro ao excluir funil" };
  }
  revalidatePath(`/app/${orgSlug}/deals`);
  return { ok: true as const };
}

export async function ensureDefaultPipelineAction(orgSlug: string) {
  const { org } = await requireOrgMember({ orgSlug });
  const supabase = await createClient();
  const { count } = await supabase
    .from("pipelines")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", org.id);

  if ((count ?? 0) > 0) return { ok: true as const };

  const { error } = await supabase.from("pipelines").insert({
    organization_id: org.id,
    name: "Captação",
    is_default: true,
  });
  if (error) {
    console.error("ensureDefaultPipelineAction", error);
    return { ok: false as const, error: "Erro ao criar funil padrão" };
  }
  revalidatePath(`/app/${orgSlug}/deals`);
  return { ok: true as const };
}
