"use client";

import { RefreshCwIcon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { triggerAdvboxSyncAction } from "@/lib/advbox/actions";

export function SyncAdvboxButton({ orgSlug }: { orgSlug: string }) {
  const [syncing, start] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={syncing}
      className="gap-1.5"
      onClick={() =>
        start(async () => {
          toast.loading("Importando do Advbox...", { id: "sync" });
          const r = await triggerAdvboxSyncAction(orgSlug);
          toast.dismiss("sync");
          if (!r.ok) toast.error(r.error);
          else
            toast.success(
              `Sync concluído — ${r.data?.atualizados ?? 0} processos importados`,
            );
        })
      }
    >
      <RefreshCwIcon className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Importando..." : "Sincronizar Advbox"}
    </Button>
  );
}
