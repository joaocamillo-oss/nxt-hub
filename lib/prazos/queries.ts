import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

export type Prazo = Database["public"]["Tables"]["prazos"]["Row"];
export type PrazoTipo = Database["public"]["Enums"]["prazo_tipo"];
export type PrazoStatus = Database["public"]["Enums"]["prazo_status"];

export type PrazoWithProcesso = Prazo & {
  processos: { id: string; numero_cnj: string; tribunal: string } | null;
};

export async function getOrgPrazos(orgId: string): Promise<PrazoWithProcesso[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prazos")
    .select("*, processos(id, numero_cnj, tribunal)")
    .eq("organization_id", orgId)
    .order("data_prazo", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PrazoWithProcesso[];
}

export async function getOrgPrazosAtivos(orgId: string): Promise<PrazoWithProcesso[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prazos")
    .select("*, processos(id, numero_cnj, tribunal)")
    .eq("organization_id", orgId)
    .eq("status", "pendente")
    .order("data_prazo", { ascending: true });
  if (error) throw error;
  return (data ?? []) as PrazoWithProcesso[];
}

export async function getPrazo(orgId: string, id: string): Promise<PrazoWithProcesso | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prazos")
    .select("*, processos(id, numero_cnj, tribunal)")
    .eq("organization_id", orgId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as PrazoWithProcesso | null;
}

export async function getProcessoPrazos(
  orgId: string,
  processoId: string,
): Promise<Prazo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prazos")
    .select("*")
    .eq("organization_id", orgId)
    .eq("processo_id", processoId)
    .order("data_prazo", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
