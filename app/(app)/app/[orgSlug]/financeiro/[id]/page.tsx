import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { requireOrgMember } from "@/lib/auth/guards";
import { getHonorario } from "@/lib/financeiro/queries";
import {
  honorarioStatusLabels,
  honorarioTipoLabels,
} from "@/lib/financeiro/schemas";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ParcelasList } from "./parcelas-list";

type Props = { params: Promise<{ orgSlug: string; id: string }> };

export async function generateMetadata({ params }: Props) {
  return { title: "Honorários" };
}

const valorBR = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const statusStyle = {
  ativo: "border-primary/40 text-primary bg-primary/10",
  encerrado: "border-border text-muted-foreground",
  cancelado: "border-destructive/40 text-destructive bg-destructive/10",
} as const;

export default async function HonorarioDetailPage({ params }: Props) {
  const { orgSlug, id } = await params;
  const { org } = await requireOrgMember({ orgSlug });
  const honorario = await getHonorario(org.id, id);

  if (!honorario) notFound();

  const pagas = honorario.parcelas.filter((p) => p.status === "pago").length;
  const valorRecebido = honorario.parcelas
    .filter((p) => p.status === "pago")
    .reduce((s, p) => s + Number(p.valor_pago ?? p.valor), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Link
          href={`/app/${orgSlug}/financeiro`}
          className="flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Financeiro
        </Link>
        <span>/</span>
        <span className="text-foreground">
          {honorarioTipoLabels[honorario.tipo as keyof typeof honorarioTipoLabels]}
        </span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-semibold text-2xl tracking-tight">
            {honorarioTipoLabels[honorario.tipo as keyof typeof honorarioTipoLabels]}
          </h1>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={statusStyle[honorario.status as keyof typeof statusStyle]}
            >
              {honorarioStatusLabels[honorario.status as keyof typeof honorarioStatusLabels]}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Parcelas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">
                Parcelas ({pagas}/{honorario.num_parcelas} pagas)
              </h2>
            </div>
            <ParcelasList parcelas={honorario.parcelas} orgSlug={orgSlug} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-mono font-semibold">
                  {valorBR.format(Number(honorario.valor_total))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Recebido</span>
                <span className="font-mono text-green-600 dark:text-green-400">
                  {valorBR.format(valorRecebido)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pendente</span>
                <span className="font-mono">
                  {valorBR.format(Number(honorario.valor_total) - valorRecebido)}
                </span>
              </div>
              {honorario.percentual_exito && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">% êxito</span>
                  <span className="font-mono">{honorario.percentual_exito}%</span>
                </div>
              )}
            </CardContent>
          </Card>

          {honorario.contacts && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/app/${orgSlug}/contatos/${honorario.contacts.id}`}
                  className="text-sm hover:text-primary hover:underline"
                >
                  {honorario.contacts.name}
                </Link>
              </CardContent>
            </Card>
          )}

          {honorario.processos && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Processo</CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/app/${orgSlug}/processos/${honorario.processos.id}`}
                  className="font-mono text-sm hover:text-primary hover:underline"
                >
                  {honorario.processos.numero_cnj}
                </Link>
              </CardContent>
            </Card>
          )}

          {honorario.descricao && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{honorario.descricao}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
