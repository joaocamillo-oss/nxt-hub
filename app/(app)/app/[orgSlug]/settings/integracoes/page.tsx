import { requireOrgRole } from "@/lib/auth/guards";
import { getAdvboxConfig } from "@/lib/advbox/config";
import { getAsaasConfig } from "@/lib/asaas/config";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AsaasConfigForm } from "./asaas-config-form";
import { AdvboxConfigForm } from "./advbox-config-form";

type Props = { params: Promise<{ orgSlug: string }> };

export const metadata = { title: "Integrações" };

export default async function IntegracoesPage({ params }: Props) {
  const { orgSlug } = await params;
  const { org } = await requireOrgRole({ orgSlug, roles: ["owner", "admin"] });

  const supabase = await createClient();

  // Buscar config Asaas
  const { data: asaasRow } = await supabase
    .from("asaas_config")
    .select("environment, webhook_token")
    .eq("organization_id", org.id)
    .maybeSingle();

  // Buscar config Advbox
  const advboxConfig = await getAdvboxConfig(org.id);

  // Buscar último sync log
  const { data: lastSync } = await supabase
    .from("advbox_sync_logs")
    .select("started_at, status, processos_criados, processos_atualizados, erro")
    .eq("organization_id", org.id)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="max-w-2xl space-y-8">
      <div className="space-y-1.5">
        <span className="label-mono">/ integrações</span>
        <h1 className="font-semibold text-3xl tracking-tight">Integrações</h1>
        <p className="text-muted-foreground text-sm">
          Configure as integrações externas do escritório.
        </p>
      </div>

      {/* Asaas */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-card/40 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="label-mono text-[10px]">/ asaas — cobranças</CardTitle>
            {asaasRow && (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
                conectado
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <CardDescription className="mb-4 text-sm">
            Gere cobranças PIX, boleto e cartão vinculadas a parcelas de honorários.
            Obtenha sua API Key em{" "}
            <a
              href="https://www.asaas.com/dashboard/configurations/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              asaas.com → Configurações → API
            </a>
            .
          </CardDescription>
          <AsaasConfigForm
            orgSlug={orgSlug}
            defaultEnvironment={asaasRow?.environment ?? "sandbox"}
            defaultWebhookToken={asaasRow?.webhook_token ?? ""}
            isConfigured={!!asaasRow}
          />
        </CardContent>
      </Card>

      {/* Advbox */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/60 bg-card/40 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="label-mono text-[10px]">/ advbox — processos</CardTitle>
            {advboxConfig && (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
                conectado
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <CardDescription className="mb-4 text-sm">
            Importe processos judiciais diretamente do Advbox. Os processos são
            sincronizados preservando número CNJ, partes, tribunal e movimentações.
            Obtenha sua API Key em{" "}
            <span className="font-mono text-foreground">
              Advbox → Configurações → Integrações → API
            </span>
            .
          </CardDescription>
          <AdvboxConfigForm
            orgSlug={orgSlug}
            defaultSubdomain={advboxConfig?.subdomain ?? ""}
            defaultSyncEnabled={advboxConfig?.syncEnabled ?? false}
            isConfigured={!!advboxConfig}
            lastSync={
              lastSync
                ? {
                    at: lastSync.started_at,
                    status: lastSync.status,
                    criados: lastSync.processos_criados,
                    atualizados: lastSync.processos_atualizados,
                    erro: lastSync.erro,
                  }
                : null
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
