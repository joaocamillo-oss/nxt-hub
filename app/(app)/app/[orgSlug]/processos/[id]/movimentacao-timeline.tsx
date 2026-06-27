"use client";

import { AlertCircleIcon, FileTextIcon } from "lucide-react";
import type { Movimentacao } from "@/lib/processos/queries";
import { Badge } from "@/components/ui/badge";

const tipoLabels: Record<string, string> = {
  andamento: "Andamento",
  intimacao: "Intimação",
  despacho: "Despacho",
  sentenca: "Sentença",
  acordao: "Acórdão",
  peticao: "Petição",
};

const tipoStyle: Record<string, string> = {
  andamento: "border-border text-muted-foreground",
  intimacao: "border-destructive/40 text-destructive bg-destructive/10",
  despacho: "border-chart-3/40 text-chart-3 bg-chart-3/10",
  sentenca: "border-chart-2/40 text-chart-2 bg-chart-2/10",
  acordao: "border-chart-2/40 text-chart-2 bg-chart-2/10",
  peticao: "border-primary/40 text-primary bg-primary/10",
};

export function MovimentacaoTimeline({ movimentacoes }: { movimentacoes: Movimentacao[] }) {
  if (movimentacoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center">
        <FileTextIcon className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">Nenhuma movimentação registrada.</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-0 border-l border-border pl-6">
      {movimentacoes.map((mov) => (
        <li key={mov.id} className="relative pb-6 last:pb-0">
          {/* dot */}
          <span className="-left-[9px] absolute top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background">
            {mov.is_intimacao ? (
              <AlertCircleIcon className="h-2.5 w-2.5 text-destructive" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
            )}
          </span>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-muted-foreground text-xs">
                {new Date(mov.data_movimentacao).toLocaleDateString("pt-BR")}
              </span>
              <Badge variant="outline" className={tipoStyle[mov.tipo] ?? ""}>
                {tipoLabels[mov.tipo] ?? mov.tipo}
              </Badge>
              {mov.prazo_dias && (
                <Badge variant="outline" className="border-destructive/40 text-destructive bg-destructive/10">
                  Prazo: {mov.prazo_dias}d úteis
                </Badge>
              )}
            </div>
            <p className="text-sm leading-relaxed">{mov.descricao}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
