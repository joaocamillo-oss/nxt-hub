"use client";

import { CheckCircleIcon, CopyIcon, ExternalLinkIcon, Loader2Icon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateParcelaAction } from "@/lib/financeiro/actions";
import { parcelaStatusLabels } from "@/lib/financeiro/schemas";
import type { Parcela, ParcelaStatus } from "@/lib/financeiro/queries";

const statusStyle: Record<ParcelaStatus, string> = {
  pendente: "border-border text-muted-foreground",
  pago: "border-primary/40 text-primary bg-primary/10",
  vencido: "border-red-500/30 text-red-600 bg-red-500/10",
  cancelado: "border-border text-muted-foreground",
};

const valorBR = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function MarcarPagoButton({
  parcela,
  orgSlug,
}: {
  parcela: Parcela;
  orgSlug: string;
}) {
  const [pending, start] = useTransition();
  if (parcela.status === "pago" || parcela.status === "cancelado") return null;

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 gap-1 text-xs"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await updateParcelaAction({
            orgSlug,
            id: parcela.id,
            status: "pago",
            dataPagamento: new Date().toISOString().split("T")[0],
            valorPago: Number(parcela.valor),
          });
          if (!r.ok) toast.error(r.error);
          else toast.success(`Parcela ${parcela.numero} marcada como paga`);
        })
      }
    >
      {pending ? (
        <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <CheckCircleIcon className="h-3.5 w-3.5" />
      )}
      {pending ? "..." : "Marcar pago"}
    </Button>
  );
}

export function ParcelasList({
  parcelas,
  orgSlug,
}: {
  parcelas: Parcela[];
  orgSlug: string;
}) {
  const sorted = [...parcelas].sort((a, b) => a.numero - b.numero);

  return (
    <div className="divide-y divide-border rounded-lg border">
      {sorted.map((p) => {
        const isVencido =
          p.status === "pendente" &&
          p.data_vencimento < (new Date().toISOString().split("T")[0] ?? "");
        const statusFinal: ParcelaStatus = isVencido ? "vencido" : (p.status as ParcelaStatus);

        return (
          <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="w-8 font-mono text-muted-foreground text-xs">
              #{p.numero}
            </span>

            <span className="font-mono text-sm font-semibold">
              {valorBR.format(Number(p.valor))}
            </span>

            <span className="font-mono text-muted-foreground text-xs">
              {new Date(`${p.data_vencimento}T00:00:00`).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>

            <Badge variant="outline" className={statusStyle[statusFinal]}>
              {parcelaStatusLabels[statusFinal]}
            </Badge>

            <div className="ml-auto flex items-center gap-1">
              {p.asaas_pix_copy_paste && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs"
                  onClick={() => {
                    navigator.clipboard.writeText(p.asaas_pix_copy_paste!);
                    toast.success("Copia-e-cola PIX copiado");
                  }}
                >
                  <CopyIcon className="h-3.5 w-3.5" />
                  PIX
                </Button>
              )}
              {p.asaas_invoice_url && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 text-xs"
                  render={
                    <a
                      href={p.asaas_invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                  Boleto
                </Button>
              )}
              <MarcarPagoButton parcela={p} orgSlug={orgSlug} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
