import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, CalendarIcon, ScaleIcon, UserIcon } from "lucide-react";
import { requireOrgMember } from "@/lib/auth/guards";
import { getProcesso, getProcessoMovimentacoes } from "@/lib/processos/queries";
import {
  processoFaseLabels,
  processoStatusLabels,
  processoTipoLabels,
} from "@/lib/processos/schemas";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { NewMovimentacaoDialog } from "./new-movimentacao-dialog";
import { MovimentacaoTimeline } from "./movimentacao-timeline";

type Props = { params: Promise<{ orgSlug: string; id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id, orgSlug } = await params;
  const { org } = await requireOrgMember({ orgSlug });
  const processo = await getProcesso(org.id, id);
  return { title: processo ? `Processo ${processo.numero_cnj}` : "Processo" };
}

const valorBR = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export default async function ProcessoDetailPage({ params }: Props) {
  const { orgSlug, id } = await params;
  const { org } = await requireOrgMember({ orgSlug });
  const [processo, movimentacoes] = await Promise.all([
    getProcesso(org.id, id),
    getProcessoMovimentacoes(org.id, id),
  ]);

  if (!processo) notFound();

  const faseStyle = {
    conhecimento: "border-chart-2/40 text-chart-2 bg-chart-2/10",
    recursal: "border-chart-3/40 text-chart-3 bg-chart-3/10",
    execucao: "border-chart-4/40 text-chart-4 bg-chart-4/10",
    arquivado: "border-border text-muted-foreground",
  } as const;

  const statusStyle = {
    ativo: "border-primary/40 text-primary bg-primary/10",
    suspenso: "border-chart-3/40 text-chart-3 bg-chart-3/10",
    encerrado: "border-border text-muted-foreground",
    arquivado: "border-border text-muted-foreground",
  } as const;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Link
          href={`/app/${orgSlug}/processos`}
          className="flex items-center gap-1 hover:text-foreground"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Processos
        </Link>
        <span>/</span>
        <span className="font-mono text-foreground">{processo.numero_cnj}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ScaleIcon className="h-5 w-5 text-muted-foreground" />
            <h1 className="font-mono font-semibold text-2xl tracking-tight">
              {processo.numero_cnj}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={faseStyle[processo.fase as keyof typeof faseStyle]}
            >
              {processoFaseLabels[processo.fase as keyof typeof processoFaseLabels]}
            </Badge>
            <Badge
              variant="outline"
              className={statusStyle[processo.status as keyof typeof statusStyle]}
            >
              {processoStatusLabels[processo.status as keyof typeof processoStatusLabels]}
            </Badge>
            <span className="rounded border border-border px-2 py-0.5 text-muted-foreground text-xs">
              {processoTipoLabels[processo.tipo as keyof typeof processoTipoLabels]}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Dados do processo */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados processuais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Info label="Tribunal" value={processo.tribunal} />
              <Info label="Vara" value={processo.vara ?? "—"} />
              <Info label="Comarca" value={processo.comarca ?? "—"} />
              <Info
                label="Data distribuição"
                value={
                  processo.data_distribuicao
                    ? new Date(processo.data_distribuicao).toLocaleDateString("pt-BR")
                    : "—"
                }
              />
              <Info label="Polo ativo" value={processo.polo_ativo} />
              <Info label="Polo passivo" value={processo.polo_passivo} />
              <Info
                label="Valor da causa"
                value={
                  processo.valor_causa ? valorBR.format(Number(processo.valor_causa)) : "—"
                }
              />
              {processo.contacts && (
                <div className="space-y-1">
                  <dt className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    Cliente
                  </dt>
                  <dd>
                    <Link
                      href={`/app/${orgSlug}/contatos/${processo.contacts.id}`}
                      className="flex items-center gap-1.5 text-sm hover:text-primary hover:underline"
                    >
                      <UserIcon className="h-3.5 w-3.5" />
                      {processo.contacts.name}
                    </Link>
                  </dd>
                </div>
              )}
            </CardContent>
          </Card>

          {processo.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{processo.observacoes}</p>
              </CardContent>
            </Card>
          )}

          {/* Timeline de movimentações */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Movimentações</h2>
              <NewMovimentacaoDialog orgSlug={orgSlug} processoId={processo.id} />
            </div>
            <MovimentacaoTimeline movimentacoes={movimentacoes} />
          </div>
        </div>

        {/* Sidebar de datas */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarIcon className="h-4 w-4" />
                Datas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Info
                label="Cadastrado"
                value={new Date(processo.created_at).toLocaleDateString("pt-BR")}
              />
              <Separator />
              <Info
                label="Última atualização"
                value={new Date(processo.updated_at).toLocaleDateString("pt-BR")}
              />
              {processo.data_encerramento && (
                <>
                  <Separator />
                  <Info
                    label="Encerrado em"
                    value={new Date(processo.data_encerramento).toLocaleDateString("pt-BR")}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <dt className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
        {label}
      </dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}
