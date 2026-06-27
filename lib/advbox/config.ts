import { createClient } from "@/lib/supabase/server";
import { decryptApiKey, encryptApiKey } from "@/lib/asaas/config";

export interface AdvboxConfig {
  apiKey: string;
  subdomain: string;
  syncEnabled: boolean;
  lastSyncAt: string | null;
}

export async function getAdvboxConfig(orgId: string): Promise<AdvboxConfig | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("advbox_config")
    .select("api_key_enc, subdomain, sync_enabled, last_sync_at")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (!data) return null;
  return {
    apiKey: decryptApiKey(data.api_key_enc),
    subdomain: data.subdomain,
    syncEnabled: data.sync_enabled,
    lastSyncAt: data.last_sync_at,
  };
}

export async function upsertAdvboxConfig(
  orgId: string,
  apiKey: string,
  subdomain: string,
  syncEnabled: boolean,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("advbox_config").upsert({
    organization_id: orgId,
    api_key_enc: encryptApiKey(apiKey),
    subdomain,
    sync_enabled: syncEnabled,
  });
}
