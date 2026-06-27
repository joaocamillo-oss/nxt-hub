import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";
import { mapAsaasStatus } from "@/lib/asaas/client";

interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    status: string;
    value: number;
    externalReference?: string;
  };
}

/**
 * Webhook Asaas — recebe eventos de pagamento e atualiza parcelas.
 * URL: POST /api/webhooks/asaas?orgId=<uuid>
 *
 * Configurar no painel Asaas: Minha Conta → Notificações → Webhook
 */
export async function POST(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  // Verificar token (opcional mas recomendado)
  const supabase = await createClient();
  const { data: config } = await supabase
    .from("asaas_config")
    .select("webhook_token")
    .eq("organization_id", orgId)
    .maybeSingle();

  if (config?.webhook_token) {
    const token = req.headers.get("asaas-access-token");
    if (token !== config.webhook_token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const payload = (await req.json().catch(() => null)) as AsaasWebhookPayload | null;
  if (!payload?.payment) {
    return NextResponse.json({ ok: true }); // evento sem pagamento — ignorar
  }

  const { id: asaasPaymentId, status, value } = payload.payment;
  const novoStatus = mapAsaasStatus(
    status as Parameters<typeof mapAsaasStatus>[0],
  );

  const { error } = await supabase
    .from("parcelas")
    .update({
      status: novoStatus,
      ...(novoStatus === "pago"
        ? {
            data_pagamento: new Date().toISOString().split("T")[0],
            valor_pago: value,
          }
        : {}),
    })
    .eq("asaas_payment_id", asaasPaymentId)
    .eq("organization_id", orgId);

  if (error) logError("webhook.asaas.update", error);

  return NextResponse.json({ ok: true });
}
