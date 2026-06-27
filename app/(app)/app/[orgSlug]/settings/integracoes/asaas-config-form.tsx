"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveAsaasConfigAction } from "@/lib/advbox/actions";

export function AsaasConfigForm({
  orgSlug,
  defaultEnvironment,
  defaultWebhookToken,
  isConfigured,
}: {
  orgSlug: string;
  defaultEnvironment: string;
  defaultWebhookToken: string;
  isConfigured: boolean;
}) {
  const [pending, start] = useTransition();
  const [apiKey, setApiKey] = useState("");
  const [environment, setEnvironment] = useState(defaultEnvironment);
  const [webhookToken, setWebhookToken] = useState(defaultWebhookToken);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey && !isConfigured) {
      toast.error("Informe a API Key");
      return;
    }
    start(async () => {
      const r = await saveAsaasConfigAction({
        orgSlug,
        apiKey: apiKey || "UNCHANGED",
        environment: environment as "sandbox" | "production",
        webhookToken,
      });
      if (!r.ok) toast.error(r.error);
      else toast.success("Configuração Asaas salva");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="asaas-key">
          API Key {isConfigured && <span className="text-muted-foreground text-xs">(deixe em branco para manter a atual)</span>}
        </Label>
        <Input
          id="asaas-key"
          type="password"
          placeholder={isConfigured ? "••••••••••••••••••••" : "Cole sua API Key aqui"}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Ambiente</Label>
        <Select value={environment} onValueChange={(v) => { if (v) setEnvironment(v as string); }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sandbox">Sandbox (testes)</SelectItem>
            <SelectItem value="production">Produção</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="webhook-token">
          Token do webhook{" "}
          <span className="text-muted-foreground text-xs">(opcional, para validar eventos)</span>
        </Label>
        <Input
          id="webhook-token"
          placeholder="Token secreto"
          value={webhookToken}
          onChange={(e) => setWebhookToken(e.target.value)}
        />
        <p className="text-muted-foreground text-xs">
          URL do webhook:{" "}
          <span className="font-mono">
            {typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/asaas?orgId=
            {"<seu-org-id>"}
          </span>
        </p>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : isConfigured ? "Atualizar configuração" : "Conectar Asaas"}
      </Button>
    </form>
  );
}
