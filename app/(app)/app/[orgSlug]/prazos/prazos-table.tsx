"use client";

import { CalendarClockIcon } from "lucide-react";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import type { PrazoWithProcesso } from "@/lib/prazos/queries";
import { getPrazoColumns } from "./prazo-columns";

export function PrazosTable({
  orgSlug,
  prazos,
}: {
  orgSlug: string;
  prazos: PrazoWithProcesso[];
}) {
  return (
    <DataTable
      columns={getPrazoColumns(orgSlug)}
      data={prazos}
      searchColumn="titulo"
      searchPlaceholder="Buscar por título..."
      empty={
        <EmptyState
          icon={CalendarClockIcon}
          title="Nenhum prazo cadastrado"
          description="Adicione prazos processuais para acompanhar os vencimentos."
        />
      }
    />
  );
}
