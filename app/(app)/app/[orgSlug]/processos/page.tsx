import { requireOrgMember } from "@/lib/auth/guards";
import { getAdvboxConfig } from "@/lib/advbox/config";
import { getOrgProcessos } from "@/lib/processos/queries";
import { NewProcessoDialog } from "./new-processo-dialog";
import { ProcessosTable } from "./processos-table";
import { SyncAdvboxButton } from "./sync-advbox-button";

type Props = { params: Promise<{ orgSlug: string }> };

export const metadata = { title: "Processos" };

export default async function ProcessosPage({ params }: Props) {
  const { orgSlug } = await params;
  const { org } = await requireOrgMember({ orgSlug });
  const [processos, advboxConfig] = await Promise.all([
    getOrgProcessos(org.id),
    getAdvboxConfig(org.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <span className="label-mono">/ processos</span>
          <h1 className="font-semibold text-3xl tracking-tight">Processos</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie os processos judiciais do escritório.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {advboxConfig && <SyncAdvboxButton orgSlug={orgSlug} />}
          <NewProcessoDialog orgSlug={orgSlug} />
        </div>
      </div>

      <ProcessosTable orgSlug={orgSlug} processos={processos} />
    </div>
  );
}
