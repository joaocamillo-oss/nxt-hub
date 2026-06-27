"use server";

import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logger";
import {
  advboxListMovimentacoes,
  advboxListProcessos,
  mapAdvboxFase,
  mapAdvboxStatus,
  mapAdvboxTipo,
  type AdvboxProcesso,
} from "./client";
import { getAdvboxConfig } from "./config";

export interface SyncResult {
  criados: number;
  atualizados: number;
  erros: number;
}

/**
 * Sincroniza todos os processos do Advbox para o banco local.
 * Usa upsert por `advbox_id` para evitar duplicatas.
 * Retorna contadores de criados/atualizados/erros.
 */
export async function syncAdvboxProcessos(orgId: string): Promise<SyncResult> {
  const config = await getAdvboxConfig(orgId);
  if (!config) throw new Error("Advbox não configurado para esta organização");

  const supabase = await createClient();
  const result: SyncResult = { criados: 0, atualizados: 0, erros: 0 };

  // Criar log de sync
  const { data: log } = await supabase
    .from("advbox_sync_logs")
    .insert({ organization_id: orgId })
    .select("id")
    .single();

  const logId = log?.id;

  try {
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await advboxListProcessos(
        config.subdomain,
        config.apiKey,
        page,
        50,
      );

      for (const proc of response.data) {
        try {
          await upsertProcesso(supabase, orgId, proc);
          // Detectar se foi insert ou update pelo count
          result.atualizados++;
        } catch (e) {
          logError("advbox.sync.processo", e);
          result.erros++;
        }
      }

      hasMore = page < response.meta.last_page;
      page++;
    }

    // Atualizar last_sync_at
    await supabase
      .from("advbox_config")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("organization_id", orgId);

    // Finalizar log
    if (logId) {
      await supabase.from("advbox_sync_logs").update({
        status: "success",
        finished_at: new Date().toISOString(),
        processos_criados: result.criados,
        processos_atualizados: result.atualizados,
      }).eq("id", logId);
    }
  } catch (e) {
    logError("advbox.sync", e);
    if (logId) {
      await supabase.from("advbox_sync_logs").update({
        status: "error",
        finished_at: new Date().toISOString(),
        erro: e instanceof Error ? e.message : "Erro desconhecido",
      }).eq("id", logId);
    }
    throw e;
  }

  return result;
}

async function upsertProcesso(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  proc: AdvboxProcesso,
): Promise<void> {
  const numeroCnj = proc.numero_cnj ?? proc.numero;

  await supabase.from("processos").upsert(
    {
      organization_id: orgId,
      numero_cnj: numeroCnj,
      tribunal: proc.tribunal ?? "N/I",
      vara: proc.vara ?? null,
      comarca: proc.comarca ?? null,
      tipo: mapAdvboxTipo(proc.tipo_acao),
      fase: mapAdvboxFase(proc.fase),
      status: mapAdvboxStatus(proc.status),
      polo_ativo: proc.polo_ativo ?? "N/I",
      polo_passivo: proc.polo_passivo ?? "N/I",
      valor_causa: proc.valor_causa ?? null,
      data_distribuicao: proc.data_distribuicao ?? null,
      source: "advbox",
      advbox_id: String(proc.id),
      advbox_synced_at: new Date().toISOString(),
    },
    {
      onConflict: "organization_id,advbox_id",
      ignoreDuplicates: false,
    },
  );
}
