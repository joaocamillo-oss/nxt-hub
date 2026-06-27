"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircleIcon, XCircleIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updatePrazoAction } from "@/lib/prazos/actions";
import { calcDiasUteisRestantes, getSemaforoColor, prazoTipoLabels } from "@/lib/prazos/schemas";
import type { PrazoTipo, PrazoWithProcesso } from "@/lib/prazos/queries";
import { SemaforoBadge } from "./semaforo-badge";

function CumprirButton({ prazo, orgSlug }: { prazo: PrazoWithProcesso; orgSlug: string }) {
  const [pending, start] = useTransition();
  if (prazo.status !== "pendente") return null;
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 gap-1 text-xs"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await updatePrazoAction({
            orgSlug,
            id: prazo.id,
            status: "cumprido",
          });
          if (!r.ok) toast.error(r.error);
          else toast.success("Prazo marcado como cumprido");
        })
      }
    >
      <CheckCircleIcon className="h-3.5 w-3.5" />
      {pending ? "..." : "Cumprir"}
    </Button>
  );
}

export function getPrazoColumns(orgSlug: string): ColumnDef<PrazoWithProcesso>[] {
  return [
    {
      id: "semaforo",
      header: "",
      cell: ({ row }) => {
        const p = row.original;
        const color = getSemaforoColor(p.data_prazo, p.status as "pendente" | "cumprido" | "perdido");
        return <SemaforoBadge dataPrazo={p.data_prazo} color={color} />;
      },
    },
    {
      accessorKey: "data_prazo",
      header: "Data",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {new Date(`${row.original.data_prazo}T00:00:00`).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      accessorKey: "titulo",
      header: "Prazo",
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.original.titulo}</span>
      ),
    },
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {prazoTipoLabels[row.original.tipo as PrazoTipo]}
        </span>
      ),
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
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <CumprirButton prazo={row.original} orgSlug={orgSlug} />
      ),
    },
  ];
}
