import { z } from "zod";

export const processoFaseEnum = z.enum([
  "conhecimento",
  "recursal",
  "execucao",
  "arquivado",
]);

export const processoStatusEnum = z.enum([
  "ativo",
  "suspenso",
  "encerrado",
  "arquivado",
]);

export const processoTipoEnum = z.enum([
  "previdenciario",
  "trabalhista",
  "civel",
  "criminal",
  "tributario",
  "administrativo",
  "familia",
  "outro",
]);

export const processoTipoLabels: Record<z.infer<typeof processoTipoEnum>, string> = {
  previdenciario: "Previdenciário",
  trabalhista: "Trabalhista",
  civel: "Cível",
  criminal: "Criminal",
  tributario: "Tributário",
  administrativo: "Administrativo",
  familia: "Família",
  outro: "Outro",
};

export const processoFaseLabels: Record<z.infer<typeof processoFaseEnum>, string> = {
  conhecimento: "Conhecimento",
  recursal: "Recursal",
  execucao: "Execução",
  arquivado: "Arquivado",
};

export const processoStatusLabels: Record<z.infer<typeof processoStatusEnum>, string> = {
  ativo: "Ativo",
  suspenso: "Suspenso",
  encerrado: "Encerrado",
  arquivado: "Arquivado",
};

// Regex para número CNJ: 0000000-00.0000.0.00.0000
const cnj = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;

export const createProcessoSchema = z.object({
  orgSlug: z.string(),
  numeroCnj: z
    .string()
    .min(1, "Número CNJ obrigatório")
    .regex(cnj, "Formato inválido. Use: 0000000-00.0000.0.00.0000"),
  tribunal: z.string().min(1, "Tribunal obrigatório").max(60),
  vara: z.string().max(120).optional(),
  comarca: z.string().max(120).optional(),
  tipo: processoTipoEnum,
  fase: processoFaseEnum,
  status: processoStatusEnum,
  poloAtivo: z.string().min(1, "Polo ativo obrigatório").max(255),
  poloPassivo: z.string().min(1, "Polo passivo obrigatório").max(255),
  valorCausa: z.number().positive().nullable().optional(),
  dataDistribuicao: z.string().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  responsavelId: z.string().uuid().nullable().optional(),
  observacoes: z.string().max(2000).optional(),
});
export type CreateProcessoInput = z.infer<typeof createProcessoSchema>;

export const updateProcessoSchema = z.object({
  orgSlug: z.string(),
  id: z.string().uuid(),
  numeroCnj: z
    .string()
    .regex(cnj, "Formato inválido. Use: 0000000-00.0000.0.00.0000")
    .optional(),
  tribunal: z.string().min(1).max(60).optional(),
  vara: z.string().max(120).nullable().optional(),
  comarca: z.string().max(120).nullable().optional(),
  tipo: processoTipoEnum.optional(),
  fase: processoFaseEnum.optional(),
  status: processoStatusEnum.optional(),
  poloAtivo: z.string().min(1).max(255).optional(),
  poloPassivo: z.string().min(1).max(255).optional(),
  valorCausa: z.number().positive().nullable().optional(),
  dataDistribuicao: z.string().nullable().optional(),
  dataEncerramento: z.string().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  responsavelId: z.string().uuid().nullable().optional(),
  observacoes: z.string().max(2000).nullable().optional(),
});
export type UpdateProcessoInput = z.infer<typeof updateProcessoSchema>;

export const deleteProcessoSchema = z.object({
  orgSlug: z.string(),
  id: z.string().uuid(),
});
export type DeleteProcessoInput = z.infer<typeof deleteProcessoSchema>;

export const createMovimentacaoSchema = z.object({
  orgSlug: z.string(),
  processoId: z.string().uuid(),
  dataMovimentacao: z.string().min(1, "Data obrigatória"),
  descricao: z.string().min(1, "Descrição obrigatória").max(2000),
  tipo: z.enum(["andamento", "intimacao", "despacho", "sentenca", "acordao", "peticao"]),
  isIntimacao: z.boolean(),
  prazoDias: z.number().int().positive().nullable().optional(),
});
export type CreateMovimentacaoInput = z.infer<typeof createMovimentacaoSchema>;
