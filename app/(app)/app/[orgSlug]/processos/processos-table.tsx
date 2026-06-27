"use client";

import { ScaleIcon } from "lucide-react";
import { DataTable } from "@/components/app/data-table";
import { EmptyState } from "@/components/app/empty-state";
import type { ProcessoWithContact } from "@/lib/processos/queries";
import { getProcessoColumns } from "./processo-columns";

export function ProcessosTable({
  orgSlug,
  processos,
}: {
  orgSlug: string;
  processos: ProcessoWithContact[];
}) {
  return (
    <DataTable
      columns={getProcessoColumns(orgSlug)}
      data={processos}
      searchColumn="numero_cnj"
      searchPlaceholder="Buscar por número CNJ..."
      empty={
        <EmptyState
          icon={ScaleIcon}
          title="Nenhum processo ainda"
          description="Cadastre o primeiro processo clicando em 'Novo processo' acima."
        />
      }
    />
  );
}
