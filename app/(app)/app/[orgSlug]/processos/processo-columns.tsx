"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  processoFaseLabels,
  processoStatusLabels,
  processoTipoLabels,
} from "@/lib/processos/schemas";
import type { ProcessoFase, ProcessoStatus, ProcessoTipo, ProcessoWithContact } from "@/lib/processos/queries";

const faseStyle: Record<ProcessoFase, string> = {
  conhecimento: "border-chart-2/40 text-chart-2 bg-chart-2/10",
  recursal: "border-chart-3/40 text-chart-3 bg-chart-3/10",
  execucao: "border-chart-4/40 text-chart-4 bg-chart-4/10",
  arquivado: "border-border text-muted-foreground",
};

const statusStyle: Record<ProcessoStatus, string> = {
  ativo: "border-primary/40 text-primary bg-primary/10",
  suspenso: "border-chart-3/40 text-chart-3 bg-chart-3/10",
  encerrado: "border-border text-muted-foreground",
  arquivado: "border-border text-muted-foreground",
};

const valorBR = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function getProcessoColumns(orgSlug: string): ColumnDef<ProcessoWithContact>[] {
  return [
    {
      accessorKey: "numero_cnj",
      header: "Número CNJ",
      cell: ({ row }) => (
        <Link
          href={`/app/${orgSlug}/processos/${row.original.id}`}
          className="group flex items-center gap-1.5 font-mono text-sm hover:text-primary"
        >
          <span>{row.original.numero_cnj}</span>
          <ArrowUpRightIcon className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
        </Link>
      ),
    },
    {
      accessorKey: "tribunal",
      header: "Tribunal",
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground text-xs uppercase">
          {row.original.tribunal}
        </span>
      ),
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => (
        <span className="text-sm">
          {processoTipoLabels[row.original.tipo as ProcessoTipo]}
        </span>
      ),
    },
    {
      accessorKey: "fase",
      header: "Fase",
      cell: ({ row }) => (
        <Badge variant="outline" className={faseStyle[row.original.fase as ProcessoFase]}>
          {processoFaseLabels[row.original.fase as ProcessoFase]}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={statusStyle[row.original.status as ProcessoStatus]}>
          {processoStatusLabels[row.original.status as ProcessoStatus]}
        </Badge>
      ),
    },
    {
      accessorKey: "contacts",
      header: "Cliente",
      cell: ({ row }) => {
        const contact = row.original.contacts;
        return contact ? (
          <Link
            href={`/app/${orgSlug}/contatos/${contact.id}`}
            className="text-sm hover:text-primary hover:underline"
          >
            {contact.name}
          </Link>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      accessorKey: "valor_causa",
      header: "Valor da causa",
      cell: ({ row }) => {
        const v = row.original.valor_causa;
        return (
          <span className="font-mono text-muted-foreground text-xs">
            {v ? valorBR.format(Number(v)) : "—"}
          </span>
        );
      },
    },
  ];
}
