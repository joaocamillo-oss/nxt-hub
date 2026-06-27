import { z } from "zod";

export const prazoTipoEnum = z.enum([
  "recurso",
  "contestacao",
  "manifestacao",
  "impugnacao",
  "embargos",
  "apelacao",
  "agravo",
  "peticao_inicial",
  "outro",
]);

export const prazoStatusEnum = z.enum(["pendente", "cumprido", "perdido"]);

export const prazoTipoLabels: Record<z.infer<typeof prazoTipoEnum>, string> = {
  recurso: "Recurso",
  contestacao: "Contestação",
  manifestacao: "Manifestação",
  impugnacao: "Impugnação",
  embargos: "Embargos",
  apelacao: "Apelação",
  agravo: "Agravo",
  peticao_inicial: "Petição inicial",
  outro: "Outro",
};

export const prazoStatusLabels: Record<z.infer<typeof prazoStatusEnum>, string> = {
  pendente: "Pendente",
  cumprido: "Cumprido",
  perdido: "Perdido",
};

export const createPrazoSchema = z.object({
  orgSlug: z.string(),
  titulo: z.string().min(2, "Título obrigatório").max(255),
  tipo: prazoTipoEnum,
  status: prazoStatusEnum,
  dataPrazo: z.string().min(1, "Data obrigatória"),
  diasUteisPrazo: z.number().int().positive().nullable().optional(),
  processoId: z.string().uuid().nullable().optional(),
  responsavelId: z.string().uuid().nullable().optional(),
  observacoes: z.string().max(1000).optional(),
});
export type CreatePrazoInput = z.infer<typeof createPrazoSchema>;

export const updatePrazoSchema = z.object({
  orgSlug: z.string(),
  id: z.string().uuid(),
  titulo: z.string().min(2).max(255).optional(),
  tipo: prazoTipoEnum.optional(),
  status: prazoStatusEnum.optional(),
  dataPrazo: z.string().optional(),
  diasUteisPrazo: z.number().int().positive().nullable().optional(),
  processoId: z.string().uuid().nullable().optional(),
  responsavelId: z.string().uuid().nullable().optional(),
  observacoes: z.string().max(1000).nullable().optional(),
});
export type UpdatePrazoInput = z.infer<typeof updatePrazoSchema>;

export const deletePrazoSchema = z.object({
  orgSlug: z.string(),
  id: z.string().uuid(),
});
export type DeletePrazoInput = z.infer<typeof deletePrazoSchema>;

/** Calcula dias úteis entre hoje e a data do prazo (ignora sábado e domingo). */
export function calcDiasUteisRestantes(dataPrazo: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const prazo = new Date(`${dataPrazo}T00:00:00`);
  prazo.setHours(0, 0, 0, 0);

  if (prazo <= hoje) return prazo.getTime() === hoje.getTime() ? 0 : -1;

  let count = 0;
  const cursor = new Date(hoje);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= prazo) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

/** Retorna a cor do semáforo baseada em dias úteis restantes. */
export type SemaforoColor = "verde" | "amarelo" | "vermelho" | "vencido" | "cumprido" | "perdido";

export function getSemaforoColor(
  dataPrazo: string,
  status: z.infer<typeof prazoStatusEnum>,
): SemaforoColor {
  if (status === "cumprido") return "cumprido";
  if (status === "perdido") return "perdido";
  const dias = calcDiasUteisRestantes(dataPrazo);
  if (dias < 0) return "vencido";
  if (dias <= 2) return "vermelho";
  if (dias <= 7) return "amarelo";
  return "verde";
}
