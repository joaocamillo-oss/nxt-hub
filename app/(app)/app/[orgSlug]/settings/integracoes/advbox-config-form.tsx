"use client";

import { RefreshCwIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { saveAdvboxConfigAction, triggerAdvboxSyncAction } from "@/lib/advbox/actions";

interface LastSync {
  at: string;
  status: string;
  criados: number;
  atualizados: number;
  erro: string | null;
}

export function AdvboxConfigForm({
  orgSlug,
  defaultSubdomain,
  defaultSyncEnabled,
  isConfigured,
  lastSync,
}: {
  orgSlug: string;
  defaultSubdomain: string;
  defaultSyncEnabled: boolean;
  isConfigured: boolean;
  lastSync: LastSync | null;
}) {
  const [saving, startSave] = useTransition();
  const [syncing, startSync] = useTransition();
  const [apiKey, setApiKey] = useState("");
  const [subdomain, setSubdomain] = useState(defaultSubdomain);
  const [syncEnabled, setSyncEnabled] = useState(defaultSyncEnabled);

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    startSave(async () => {
      const r = await saveAdvboxConfigAction({
        orgSlug,
        apiKey: apiKey || "UNCHANGED",
        subdomain,
        syncEnabled,
      });
      if (!r.ok) toast.error(r.error);
      else toast.success("Configuração Advbox salva e conexão testada");
    });
  }

  function onSync() {
    startSync(async () => {
      toast.loading("Sincronizando processos...", { id: "advbox-sync" });
      const r = await triggerAdvboxSyncAction(orgSlug);
      toast.dismiss("advbox-sync");
      if (!r.ok) toast.error(r.error);
      else
        toast.success(
          `Sincronização concluída — ${r.data?.criados ?? 0} criados, ${r.data?.atualizados ?? 0} atualizados`,
        );
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSave} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="advbox-subdomain">Subdomínio Advbox</Label>
          <div className="flex items-center gap-1">
            <Input
              id="advbox-subdomain"
              placeholder="escritorio"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
              className="font-mono"
            />
            <span className="shrink-0 text-muted-foreground text-sm">.advbox.com.br</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="advbox-key">
            API Key{" "}
            {isConfigured && (
              <span className="text-muted-foreground text-xs">
                (deixe em branco para manter a atual)
              </span>
            )}
          </Label>
          <Input
            id="advbox-key"
            type="password"
            placeholder={isConfigured ? "••••••••••••••••••••" : "Cole sua API Key aqui"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="sync-enabled"
            checked={syncEnabled}
            onCheckedChange={setSyncEnabled}
          />
          <Label htmlFor="sync-enabled" className="cursor-pointer">
            Sincronização automática (futuramente via cron)
          </Label>
        </div>

        <Button type="submit" disabled={saving}>
          {saving
            ? "Testando conexão e salvando..."
            : isConfigured
              ? "Atualizar configuração"
              : "Conectar Advbox"}
        </Button>
      </form>

      {/* Sincronização manual */}
      {isConfigured && (
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Sincronização manual</p>
              <p className="text-muted-foreground text-xs">
                Importa todos os processos do Advbox para o NXT Hub.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={syncing}
              onClick={onSync}
              className="gap-1.5"
            >
              <RefreshCwIcon className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Sincronizando..." : "Sincronizar agora"}
            </Button>
          </div>

          {lastSync && (
            <div
              className={`rounded-md border px-3 py-2 text-xs ${
                lastSync.status === "success"
                  ? "border-primary/20 bg-primary/5 text-primary"
                  : lastSync.status === "error"
                    ? "border-destructive/20 bg-destructive/5 text-destructive"
                    : "border-border text-muted-foreground"
              }`}
            >
              <p className="font-medium">
                Último sync:{" "}
                {new Date(lastSync.at).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" — "}
                {lastSync.status === "success"
                  ? `${lastSync.atualizados} processos processados`
                  : lastSync.status === "error"
                    ? `Erro: ${lastSync.erro}`
                    : "Em andamento..."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
