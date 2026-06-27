/**
 * Acesso à configuração Asaas de uma organização.
 * A api_key é armazenada criptografada no banco (XOR + base64 com APP_SECRET).
 * Não é criptografia forte — para produção, use Supabase Vault ou similar.
 */

import { createClient } from "@/lib/supabase/server";
import type { AsaasEnvironment } from "./client";

const APP_SECRET = process.env.APP_SECRET ?? "nxt-hub-dev-secret-change-me";

/** Criptografia simples XOR+base64. Suficiente para ofuscar em dev; usar Vault em prod. */
function xorCrypt(text: string): string {
  const key = APP_SECRET;
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return Buffer.from(result, "binary").toString("base64");
}

export function encryptApiKey(raw: string): string {
  return xorCrypt(raw);
}

export function decryptApiKey(enc: string): string {
  const decoded = Buffer.from(enc, "base64").toString("binary");
  return xorCrypt(decoded);
}

export interface AsaasConfig {
  apiKey: string;
  environment: AsaasEnvironment;
  webhookToken: string | null;
}

export async function getAsaasConfig(orgId: string): Promise<AsaasConfig | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("asaas_config")
    .select("api_key_enc, environment, webhook_token")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    apiKey: decryptApiKey(data.api_key_enc),
    environment: data.environment as AsaasEnvironment,
    webhookToken: data.webhook_token,
  };
}
