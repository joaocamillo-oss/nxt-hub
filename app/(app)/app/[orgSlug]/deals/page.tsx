import { requireOrgMember } from "@/lib/auth/guards";
import { getCompanies } from "@/lib/companies/queries";
import { ensureDefaultPipelineAction, getPipelines } from "@/lib/deals/pipelines";
import { getDealKpis, getDealsGroupedByStage } from "@/lib/deals/queries";
import { createClient } from "@/lib/supabase/server";
import { KanbanBoard } from "./kanban-board";
import { KpiStrip } from "./kpi-strip";
import { NewDealDialog } from "./new-deal-dialog";
import { PipelineTabs } from "./pipeline-tabs";

type Props = {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ pipeline?: string }>;
};

export const metadata = { title: "CRM" };

export default async function DealsPage({ params, searchParams }: Props) {
  const { orgSlug } = await params;
  const { pipeline: pipelineParam } = await searchParams;
  const { org, role } = await requireOrgMember({ orgSlug });

  await ensureDefaultPipelineAction(orgSlug);

  const supabase = await createClient();
  const [pipelines, companies, channelsRes] = await Promise.all([
    getPipelines(org.id),
    getCompanies(org.id),
    supabase.from("channels").select("id, name").eq("organization_id", org.id).order("created_at"),
  ]);
  const channels = channelsRes.data ?? [];

  const activePipeline =
    pipelines.find((p) => p.id === pipelineParam) ??
    pipelines.find((p) => p.is_default) ??
    pipelines[0];

  const [grouped, kpis] = await Promise.all([
    getDealsGroupedByStage(org.id, activePipeline?.id ?? null),
    getDealKpis(org.id),
  ]);

  const isAdmin = role === "owner" || role === "admin";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <span className="label-mono">/ crm</span>
          <h1 className="font-semibold text-3xl tracking-tight">CRM</h1>
          <p className="text-muted-foreground text-sm">Funis de captação e negociação.</p>
        </div>
        {activePipeline && (
          <NewDealDialog
            orgSlug={orgSlug}
            companies={companies.map((c) => ({ id: c.id, name: c.name }))}
            pipelineId={activePipeline.id}
          />
        )}
      </div>

      <PipelineTabs
        orgSlug={orgSlug}
        pipelines={pipelines}
        activePipelineId={activePipeline?.id ?? null}
        channels={channels.map((c) => ({ id: c.id, name: c.name }))}
        isAdmin={isAdmin}
      />

      <KpiStrip kpis={kpis} />

      {activePipeline ? (
        <KanbanBoard orgSlug={orgSlug} initial={grouped} />
      ) : (
        <p className="text-muted-foreground text-sm">Nenhum funil encontrado.</p>
      )}
    </div>
  );
}
