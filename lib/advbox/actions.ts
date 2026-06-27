"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOrgRole } from "@/lib/auth/guards";
import { logError } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";
import { encryptApiKey } from "@/lib/asaas/config";
import { advboxListProcessos } from "./client";
import { getAdvboxConfig, upsertAdvboxConfig } from "./config";
import { syncAdvboxProcessos } from "./sync";

type ActionResult<T = void> = { ok: true; data?: T } | { ok: false; error: string };

const saveAdvboxSchema = z.object({
  orgSlug: z.string(),
  apiKey: z.string().min(10, "API Key muito curta"),
  subdomain: z
    .string()
    .min(1, "Subdomínio obrigatório")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  syncEnabled: z.boolean(),
});

export async function saveAdvboxConfigAction(
  input: z.infer<typeof saveAdvboxSchema>,
): Promise<ActionResult> {
  const parsed = saveAdvboxSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { org } = await requireOrgRole({
    orgSlug: parsed.data.orgSlug,
    roles: ["owner", "admin"],
  });

  // Testar conectividade antes de salvar
  try {
    await advboxListProcessos(parsed.data.subdomain, parsed.data.apiKey, 1, 1);
  } catch {
    return { ok: false, error: "Não foi possível conectar ao Advbox. Verifique o subdomínio e a API Key." };
  }

  await upsertAdvboxConfig(
    org.id,
    parsed.data.apiKey,
    parsed.data.subdomain,
    parsed.data.syncEnabled,
  );

  revalidatePath(`/app/${parsed.data.orgSlug}/settings/integracoes`);
  return { ok: true };
}

export async function triggerAdvboxSyncAction(
  orgSlug: string,
): Promise<ActionResult<{ criados: number; atualizados: number }>> {
  const { org } = await requireOrgRole({ orgSlug, roles: ["owner", "admin"] });

  try {
    const result = await syncAdvboxProcessos(org.id);
    revalidatePath(`/app/${orgSlug}/processos`);
    revalidatePath(`/app/${orgSlug}/settings/integracoes`);
    return { ok: true, data: { criados: result.criados, atualizados: result.atualizados } };
  } catch (e) {
    logError("advbox.sync.action", e);
    return { ok: false, error: e instanceof Error ? e.message : "Erro na sincronização" };
  }
}

const saveAsaasSchema = z.object({
  orgSlug: z.string(),
  apiKey: z.string().min(10, "API Key muito curta"),
  environment: z.enum(["sandbox", "production"]),
  webhookToken: z.string().optional(),
});

export async function saveAsaasConfigAction(
  input: z.infer<typeof saveAsaasSchema>,
): Promise<ActionResult> {
  const parsed = saveAsaasSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { org } = await requireOrgRole({
    orgSlug: parsed.data.orgSlug,
    roles: ["owner", "admin"],
  });

  const supabase = await createClient();
  const { error } = await supabase.from("asaas_config").upsert({
    organization_id: org.id,
    api_key_enc: encryptApiKey(parsed.data.apiKey),
    environment: parsed.data.environment,
    webhook_token: parsed.data.webhookToken ?? null,
  });

  if (error) {
    logError("asaas.config.save", error);
    return { ok: false, error: "Erro ao salvar configuração Asaas." };
  }

  revalidatePath(`/app/${parsed.data.orgSlug}/settings/integracoes`);
  return { ok: true };
}
