import { z } from "zod";

export const honorarioTipoEnum = z.enum(["fixo", "exito", "misto", "hora"]);
export const honorarioStatusEnum = z.enum(["ativo", "encerrado", "cancelado"]);
export const parcelaStatusEnum = z.enum(["pendente", "pago", "vencido", "cancelado"]);
export const cobrancaMetodoEnum = z.enum([
  "pix",
  "boleto",
  "cartao_credito",
  "transferencia",
  "dinheiro",
  "outro",
]);

export const honorarioTipoLabels: Record<z.infer<typeof honorarioTipoEnum>, string> = {
  fixo: "Fixo",
  exito: "Êxito",
  misto: "Misto (fixo + êxito)",
  hora: "Por hora",
};

export const honorarioStatusLabels: Record<z.infer<typeof honorarioStatusEnum>, string> = {
  ativo: "Ativo",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};

export const parcelaStatusLabels: Record<z.infer<typeof parcelaStatusEnum>, string> = {
  pendente: "Pendente",
  pago: "Pago",
  vencido: "Vencido",
  cancelado: "Cancelado",
};

export const cobrancaMetodoLabels: Record<z.infer<typeof cobrancaMetodoEnum>, string> = {
  pix: "PIX",
  boleto: "Boleto",
  cartao_credito: "Cartão de crédito",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
  outro: "Outro",
};

export const createHonorarioSchema = z.object({
  orgSlug: z.string(),
  processoId: z.string().uuid().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  tipo: honorarioTipoEnum,
  valorTotal: z.number().positive("Valor deve ser positivo"),
  valorExito: z.number().positive().nullable().optional(),
  percentualExito: z.number().min(0).max(100).nullable().optional(),
  numParcelas: z.number().int().min(1).max(120),
  // Primeira parcela vence nessa data; as demais somam 30 dias cada
  primeiroVencimento: z.string().min(1, "Data obrigatória"),
  descricao: z.string().max(500).optional(),
});
export type CreateHonorarioInput = z.infer<typeof createHonorarioSchema>;

export const updateHonorarioSchema = z.object({
  orgSlug: z.string(),
  id: z.string().uuid(),
  status: honorarioStatusEnum.optional(),
  descricao: z.string().max(500).nullable().optional(),
});
export type UpdateHonorarioInput = z.infer<typeof updateHonorarioSchema>;

export const updateParcelaSchema = z.object({
  orgSlug: z.string(),
  id: z.string().uuid(),
  status: parcelaStatusEnum.optional(),
  metodoPagamento: cobrancaMetodoEnum.nullable().optional(),
  dataPagamento: z.string().nullable().optional(),
  valorPago: z.number().positive().nullable().optional(),
});
export type UpdateParcelaInput = z.infer<typeof updateParcelaSchema>;

export const gerarCobrancaAsaasSchema = z.object({
  orgSlug: z.string(),
  parcelaId: z.string().uuid(),
  billingType: z.enum(["PIX", "BOLETO", "CREDIT_CARD"]),
  asaasCustomerId: z.string().min(1, "ID do cliente Asaas obrigatório"),
});
export type GerarCobrancaAsaasInput = z.infer<typeof gerarCobrancaAsaasSchema>;

/** Gera datas de vencimento mensais a partir da primeira. */
export function gerarVencimentos(primeiroVencimento: string, numParcelas: number): string[] {
  const datas: string[] = [];
  const base = new Date(`${primeiroVencimento}T00:00:00`);
  for (let i = 0; i < numParcelas; i++) {
    const d = new Date(base);
    d.setMonth(d.getMonth() + i);
    datas.push(d.toISOString().split("T")[0] ?? "");
  }
  return datas;
}
