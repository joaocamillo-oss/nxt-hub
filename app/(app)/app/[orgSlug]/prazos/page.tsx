import { AlertTriangleIcon, CalendarClockIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";
import { requireOrgMember } from "@/lib/auth/guards";
import { getOrgPrazos } from "@/lib/prazos/queries";
import { calcDiasUteisRestantes, getSemaforoColor } from "@/lib/prazos/schemas";
import { Card, CardContent } from "@/components/ui/card";
import { NewPrazoDialog } from "./new-prazo-dialog";
import { PrazosTable } from "./prazos-table";

type Props = { params: Promise<{ orgSlug: string }> };

export const metadata = { title: "Prazos" };

export default async function PrazosPage({ params }: Props) {
  const { orgSlug } = await params;
  const { org } = await requireOrgMember({ orgSlug });
  const prazos = await getOrgPrazos(org.id);

  // Calcular stats dos prazos pendentes
  const pendentes = prazos.filter((p) => p.status === "pendente");
  const hoje = pendentes.filter(
    (p) => calcDiasUteisRestantes(p.data_prazo) === 0,
  ).length;
  const proximos7 = pendentes.filter((p) => {
    const d = calcDiasUteisRestantes(p.data_prazo);
    return d > 0 && d <= 7;
  }).length;
  const criticos = pendentes.filter((p) => {
    const d = calcDiasUteisRestantes(p.data_prazo);
    return d >= 0 && d <= 2;
  }).length;
  const vencidos = pendentes.filter(
    (p) => calcDiasUteisRestantes(p.data_prazo) < 0,
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <span className="label-mono">/ prazos</span>
          <h1 className="font-semibold text-3xl tracking-tight">Prazos</h1>
          <p className="text-muted-foreground text-sm">
            Acompanhe os prazos processuais com semáforo de urgência.
          </p>
        </div>
        <NewPrazoDialog orgSlug={orgSlug} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<XCircleIcon className="h-4 w-4 text-red-500" />}
          label="Vencidos"
          value={vencidos}
          highlight={vencidos > 0 ? "red" : undefined}
        />
        <StatCard
          icon={<AlertTriangleIcon className="h-4 w-4 text-red-500" />}
          label="Críticos (≤2du)"
          value={criticos}
          highlight={criticos > 0 ? "red" : undefined}
        />
        <StatCard
          icon={<CalendarClockIcon className="h-4 w-4 text-yellow-500" />}
          label="Próximos 7du"
          value={proximos7}
          highlight={proximos7 > 0 ? "yellow" : undefined}
        />
        <StatCard
          icon={<CheckCircleIcon className="h-4 w-4 text-primary" />}
          label="Hoje"
          value={hoje}
          highlight={hoje > 0 ? "red" : undefined}
        />
      </div>

      <PrazosTable orgSlug={orgSlug} prazos={prazos} />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: "red" | "yellow";
}) {
  return (
    <Card
      className={
        highlight === "red" && value > 0
          ? "border-red-500/30 bg-red-500/5"
          : highlight === "yellow" && value > 0
            ? "border-yellow-500/30 bg-yellow-500/5"
            : ""
      }
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {icon}
          <span
            className={`font-bold text-2xl tabular-nums ${
              highlight === "red" && value > 0
                ? "text-red-600 dark:text-red-400"
                : highlight === "yellow" && value > 0
                  ? "text-yellow-600 dark:text-yellow-400"
                  : ""
            }`}
          >
            {value}
          </span>
        </div>
        <p className="mt-1 text-muted-foreground text-xs">{label}</p>
      </CardContent>
    </Card>
  );
}
