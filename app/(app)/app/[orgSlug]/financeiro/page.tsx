import { ArrowDownCircleIcon, ArrowUpCircleIcon, CircleDollarSignIcon, TrendingUpIcon } from "lucide-react";
import { requireOrgMember } from "@/lib/auth/guards";
import { getFinanceiroResumo, getOrgHonorarios } from "@/lib/financeiro/queries";
import { Card, CardContent } from "@/components/ui/card";
import { HonorariosTable } from "./honorarios-table";
import { NewHonorarioDialog } from "./new-honorario-dialog";

type Props = { params: Promise<{ orgSlug: string }> };

export const metadata = { title: "Financeiro" };

const valorBR = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export default async function FinanceiroPage({ params }: Props) {
  const { orgSlug } = await params;
  const { org } = await requireOrgMember({ orgSlug });
  const [honorarios, resumo] = await Promise.all([
    getOrgHonorarios(org.id),
    getFinanceiroResumo(org.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <span className="label-mono">/ financeiro</span>
          <h1 className="font-semibold text-3xl tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground text-sm">
            Honorários, parcelas e cobranças do escritório.
          </p>
        </div>
        <NewHonorarioDialog orgSlug={orgSlug} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          icon={<TrendingUpIcon className="h-4 w-4 text-muted-foreground" />}
          label="Total previsto"
          value={valorBR.format(resumo.previsto)}
        />
        <KpiCard
          icon={<ArrowDownCircleIcon className="h-4 w-4 text-green-500" />}
          label="Recebido"
          value={valorBR.format(resumo.recebido)}
          highlight="green"
        />
        <KpiCard
          icon={<CircleDollarSignIcon className="h-4 w-4 text-yellow-500" />}
          label="A receber"
          value={valorBR.format(resumo.pendente)}
        />
        <KpiCard
          icon={<ArrowUpCircleIcon className="h-4 w-4 text-red-500" />}
          label="Inadimplente"
          value={valorBR.format(resumo.vencido)}
          highlight={resumo.vencido > 0 ? "red" : undefined}
        />
      </div>

      <HonorariosTable orgSlug={orgSlug} honorarios={honorarios} />
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: "green" | "red";
}) {
  return (
    <Card
      className={
        highlight === "red"
          ? "border-red-500/30 bg-red-500/5"
          : highlight === "green"
            ? "border-green-500/30 bg-green-500/5"
            : ""
      }
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">{icon}</div>
        <p
          className={`mt-2 font-bold text-lg tabular-nums ${
            highlight === "red"
              ? "text-red-600 dark:text-red-400"
              : highlight === "green"
                ? "text-green-600 dark:text-green-400"
                : ""
          }`}
        >
          {value}
        </p>
        <p className="text-muted-foreground text-xs">{label}</p>
      </CardContent>
    </Card>
  );
}
