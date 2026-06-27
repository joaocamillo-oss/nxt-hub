import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

export type Honorario = Database["public"]["Tables"]["honorarios"]["Row"];
export type Parcela = Database["public"]["Tables"]["parcelas"]["Row"];
export type HonorarioTipo = Database["public"]["Enums"]["honorario_tipo"];
export type HonorarioStatus = Database["public"]["Enums"]["honorario_status"];
export type ParcelaStatus = Database["public"]["Enums"]["parcela_status"];

export type HonorarioWithDetails = Honorario & {
  processos: { id: string; numero_cnj: string } | null;
  contacts: { id: string; name: string } | null;
  parcelas: Parcela[];
};

export async function getOrgHonorarios(orgId: string): Promise<HonorarioWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("honorarios")
    .select("*, processos(id, numero_cnj), contacts(id, name), parcelas(*)")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as HonorarioWithDetails[];
}

export async function getHonorario(
  orgId: string,
  id: string,
): Promise<HonorarioWithDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("honorarios")
    .select("*, processos(id, numero_cnj), contacts(id, name), parcelas(*)")
    .eq("organization_id", orgId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as HonorarioWithDetails | null;
}

export async function getParcela(orgId: string, id: string): Promise<Parcela | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parcelas")
    .select("*")
    .eq("organization_id", orgId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Resumo financeiro da org: total previsto, recebido e inadimplente. */
export async function getFinanceiroResumo(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("parcelas")
    .select("valor, status, data_vencimento")
    .eq("organization_id", orgId);
  if (error) throw error;

  const hoje = new Date().toISOString().split("T")[0] ?? "";
  let previsto = 0;
  let recebido = 0;
  let vencido = 0;

  for (const p of data ?? []) {
    const v = Number(p.valor);
    previsto += v;
    if (p.status === "pago") recebido += v;
    else if (p.status === "pendente" && p.data_vencimento < hoje) vencido += v;
  }

  return { previsto, recebido, vencido, pendente: previsto - recebido };
}
