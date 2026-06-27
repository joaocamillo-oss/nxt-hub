/**
 * Cliente HTTP para a API Advbox.
 * Documentação: https://advbox.com.br/api
 *
 * Advbox usa autenticação por API Key no header Authorization.
 * Base URL: https://{subdomain}.advbox.com.br/api/v1
 */

export interface AdvboxProcesso {
  id: number;
  numero: string; // número CNJ ou número interno
  numero_cnj?: string;
  titulo?: string;
  status: string;
  fase?: string;
  tipo_acao?: string;
  tribunal?: string;
  vara?: string;
  comarca?: string;
  polo_ativo?: string;
  polo_passivo?: string;
  valor_causa?: number;
  data_distribuicao?: string; // YYYY-MM-DD
  responsavel?: {
    id: number;
    nome: string;
    email?: string;
  };
  cliente?: {
    id: number;
    nome: string;
    cpf_cnpj?: string;
    email?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AdvboxListResponse<T> {
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface AdvboxMovimentacao {
  id: number;
  processo_id: number;
  data: string;
  tipo: string;
  descricao: string;
  is_intimacao: boolean;
  prazo_dias?: number;
}

async function advboxRequest<T>(
  subdomain: string,
  apiKey: string,
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`https://${subdomain}.advbox.com.br/api/v1${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Advbox API ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

export async function advboxListProcessos(
  subdomain: string,
  apiKey: string,
  page = 1,
  perPage = 50,
): Promise<AdvboxListResponse<AdvboxProcesso>> {
  return advboxRequest<AdvboxListResponse<AdvboxProcesso>>(
    subdomain,
    apiKey,
    "/processos",
    { page: String(page), per_page: String(perPage) },
  );
}

export async function advboxGetProcesso(
  subdomain: string,
  apiKey: string,
  id: number,
): Promise<AdvboxProcesso> {
  return advboxRequest<AdvboxProcesso>(subdomain, apiKey, `/processos/${id}`);
}

export async function advboxListMovimentacoes(
  subdomain: string,
  apiKey: string,
  processoId: number,
  page = 1,
): Promise<AdvboxListResponse<AdvboxMovimentacao>> {
  return advboxRequest<AdvboxListResponse<AdvboxMovimentacao>>(
    subdomain,
    apiKey,
    `/processos/${processoId}/movimentacoes`,
    { page: String(page) },
  );
}

/** Mapeia fase Advbox → enum interno. */
export function mapAdvboxFase(fase?: string): "conhecimento" | "recursal" | "execucao" | "arquivado" {
  if (!fase) return "conhecimento";
  const f = fase.toLowerCase();
  if (f.includes("recurs") || f.includes("apel") || f.includes("agrav")) return "recursal";
  if (f.includes("execu")) return "execucao";
  if (f.includes("arquiv") || f.includes("encerr")) return "arquivado";
  return "conhecimento";
}

/** Mapeia status Advbox → status interno. */
export function mapAdvboxStatus(status?: string): "ativo" | "suspenso" | "encerrado" | "arquivado" {
  if (!status) return "ativo";
  const s = status.toLowerCase();
  if (s.includes("suspens")) return "suspenso";
  if (s.includes("encerr")) return "encerrado";
  if (s.includes("arquiv")) return "arquivado";
  return "ativo";
}

/** Mapeia tipo de ação Advbox → enum interno. */
export function mapAdvboxTipo(tipo?: string): "previdenciario" | "trabalhista" | "civel" | "criminal" | "tributario" | "administrativo" | "familia" | "outro" {
  if (!tipo) return "outro";
  const t = tipo.toLowerCase();
  if (t.includes("previd") || t.includes("bpc") || t.includes("loas") || t.includes("aposentad")) return "previdenciario";
  if (t.includes("trabal") || t.includes("trt")) return "trabalhista";
  if (t.includes("famil") || t.includes("divor") || t.includes("aliment")) return "familia";
  if (t.includes("crimin") || t.includes("penal")) return "criminal";
  if (t.includes("tribut") || t.includes("fiscal")) return "tributario";
  if (t.includes("admin")) return "administrativo";
  if (t.includes("civel") || t.includes("cívil")) return "civel";
  return "outro";
}
