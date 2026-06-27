import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

export type Processo = Database["public"]["Tables"]["processos"]["Row"];
export type Movimentacao = Database["public"]["Tables"]["movimentacoes"]["Row"];
export type ProcessoFase = Database["public"]["Enums"]["processo_fase"];
export type ProcessoStatus = Database["public"]["Enums"]["processo_status"];
export type ProcessoTipo = Database["public"]["Enums"]["processo_tipo"];

export type ProcessoWithContact = Processo & {
  contacts: { id: string; name: string } | null;
};

export async function getOrgProcessos(orgId: string): Promise<ProcessoWithContact[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processos")
    .select("*, contacts(id, name)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProcessoWithContact[];
}

export async function getProcesso(
  orgId: string,
  id: string,
): Promise<ProcessoWithContact | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processos")
    .select("*, contacts(id, name)")
    .eq("organization_id", orgId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as ProcessoWithContact | null;
}

export async function getProcessoMovimentacoes(
  orgId: string,
  processoId: string,
): Promise<Movimentacao[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movimentacoes")
    .select("*")
    .eq("organization_id", orgId)
    .eq("processo_id", processoId)
    .order("data_movimentacao", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
