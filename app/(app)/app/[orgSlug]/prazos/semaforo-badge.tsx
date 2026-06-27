"use client";

import { cn } from "@/lib/utils";
import { calcDiasUteisRestantes, type SemaforoColor } from "@/lib/prazos/schemas";

const colorConfig: Record<
  SemaforoColor,
  { dot: string; badge: string; label: string }
> = {
  verde: {
    dot: "bg-green-500",
    badge: "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
    label: "",
  },
  amarelo: {
    dot: "bg-yellow-500",
    badge: "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    label: "",
  },
  vermelho: {
    dot: "bg-red-500 animate-pulse",
    badge: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    label: "",
  },
  vencido: {
    dot: "bg-gray-400",
    badge: "border-border text-muted-foreground",
    label: "Vencido",
  },
  cumprido: {
    dot: "bg-primary",
    badge: "border-primary/30 bg-primary/10 text-primary",
    label: "Cumprido",
  },
  perdido: {
    dot: "bg-destructive",
    badge: "border-destructive/30 bg-destructive/10 text-destructive",
    label: "Perdido",
  },
};

export function SemaforoBadge({
  dataPrazo,
  color,
}: {
  dataPrazo: string;
  color: SemaforoColor;
}) {
  const cfg = colorConfig[color];
  const dias = calcDiasUteisRestantes(dataPrazo);

  let label = cfg.label;
  if (!label) {
    if (dias === 0) label = "Hoje";
    else if (dias === 1) label = "Amanhã";
    else label = `${dias}du`;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-xs",
        cfg.badge,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", cfg.dot)} />
      {label}
    </span>
  );
}
