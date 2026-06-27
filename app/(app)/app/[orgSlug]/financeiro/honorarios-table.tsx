"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpRightIcon, WalletIcon } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  honorarioStatusLabels,
  honorarioTipoLabels,
} from "@/lib/financeiro/schemas";
import type {
  HonorarioStatus,
  HonorarioTipo,
  HonorarioWithDetails,
  ParcelaStatus,
} from "@/lib/financeiro/queries";

const statusStyle: Record<HonorarioStatus, string> = {
  ativo: "border-primary/40 text-primary bg-primary/10",
  encerrado: "border-border text-muted-foreground",
  cancelado: "border-destructive/40 text-destructive bg-destructive/10",
};

const valorBR = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const columns = (orgSlug: string): ColumnDef<HonorarioWithDetails>[] => [
  {
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }) => (
      <span className="text-sm">
        {honorarioTipoLabels[row.original.tipo as HonorarioTipo]}
      </span>
    ),
  },
  {
    accessorKey: "valor_total",
    header: "Valor total",
    cell: ({ row }) => (
      <Link
        href={`/app/${orgSlug}/financeiro/${row.original.id}`}
        className="group flex items-center gap-1 font-mono font-semibold text-sm hover:text-primary"
      >
        {valorBR.format(Number(row.original.valor_total))}
        <ArrowUpRightIcon className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
      </Link>
    ),
  },
  {
    id: "parcelas_status",
    header: "Parcelas",
    cell: ({ row }) => {
      const parcelas = row.original.parcelas;
      const pagas = parcelas.filter((p) => p.status === "pago").length;
      const total = parcelas.length;
      return (
        <span className="font-mono text-muted-foreground text-xs">
          {pagas}/{total} pagas
        </span>
      );
    },
  },
  {
    accessorKey: "contacts",
    header: "Cliente",
    cell: ({ row }) => {
      const c = row.original.contacts;
      return c ? (
        <Link
          href={`/app/${orgSlug}/contatos/${c.id}`}
          className="text-sm hover:text-primary hover:underline"
        >
          {c.name}
        </Link>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      );
    },
  },
  {
    accessorKey: "processos",
    header: "Processo",
    cell: ({ row }) => {
      const p = row.original.processos;
      return p ? (
        <Link
          href={`/app/${orgSlug}/processos/${p.id}`}
          className="font-mono text-xs hover:text-primary hover:underline"
        >
          {p.numero_cnj}
        </Link>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={statusStyle[row.original.status as HonorarioStatus]}
      >
        {honorarioStatusLabels[row.original.status as HonorarioStatus]}
      </Badge>
    ),
  },
];

export function HonorariosTable({
  orgSlug,
  honorarios,
}: {
  orgSlug: string;
  honorarios: HonorarioWithDetails[];
}) {
  return (
    <DataTable
      columns={columns(orgSlug)}
      data={honorarios}
      searchColumn="tipo"
      searchPlaceholder="Filtrar por tipo..."
      empty={
        <EmptyState
          icon={WalletIcon}
          title="Nenhum honorário cadastrado"
          description="Cadastre honorários vinculados a processos ou clientes."
        />
      }
    />
  );
}
