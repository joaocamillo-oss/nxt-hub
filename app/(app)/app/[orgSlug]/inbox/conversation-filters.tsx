"use client";

import { ChevronDownIcon, SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface Pipeline {
  id: string;
  name: string;
}

interface StatusCount {
  status: string;
  count: number;
}

interface Props {
  orgSlug: string;
  currentUserId?: string;
  pipelines?: Pipeline[];
  statusCounts?: StatusCount[];
}

const STATUS_TABS = [
  { value: "", label: "Todas" },
  { value: "open", label: "Abertas" },
  { value: "pending", label: "Pendentes" },
  { value: "resolved", label: "Resolvidas" },
];

const ASSIGNEE_TABS = [
  { value: "", label: "Todas" },
  { value: "me", label: "Minhas" },
];

export function ConversationFilters({ orgSlug: _orgSlug, currentUserId: _currentUserId, pipelines = [], statusCounts = [] }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const status = sp.get("status") ?? "";
  const assignee = sp.get("assignee") ?? "";
  const pipelineId = sp.get("pipeline") ?? "";
  const q = sp.get("q") ?? "";

  function set(key: string, value: string | null) {
    const params = new URLSearchParams(sp);
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  const activePipeline = pipelines.find((p) => p.id === pipelineId);

  const countMap = new Map(statusCounts.map((s) => [s.status, s.count]));
  const totalCount = statusCounts.reduce((a, s) => a + s.count, 0);

  return (
    <div className="flex flex-col border-b border-border/60">
      {/* Barra de pesquisa + funil */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => set("q", e.target.value || null)}
            placeholder="Pesquisar..."
            className="h-8 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button
          type="button"
          aria-label="Filtros"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-input bg-background text-muted-foreground hover:text-foreground"
        >
          <SlidersHorizontalIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Dropdown de funil (se houver múltiplos funis) */}
      {pipelines.length > 0 && (
        <div className="px-3 pb-2">
          <div className="relative">
            <select
              value={pipelineId}
              onChange={(e) => set("pipeline", e.target.value || null)}
              className="h-7 w-full appearance-none rounded-md border border-input bg-background pl-2.5 pr-7 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Todos os funis</option>
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Abas Todas | Minhas */}
      <div className="flex items-center border-b border-border/40 px-3">
        {ASSIGNEE_TABS.map((t) => {
          const active = assignee === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => set("assignee", t.value || null)}
              className={cn(
                "border-b-2 px-3 py-2 text-[12px] font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Contagens por status — barra scrollável horizontal */}
      <div className="flex items-center gap-0 overflow-x-auto px-3 py-2 scrollbar-none">
        {/* Opção "Todos" */}
        <StatusPill
          label="Todos"
          count={totalCount}
          active={status === ""}
          onClick={() => set("status", null)}
          first
        />
        {STATUS_TABS.filter((t) => t.value !== "").map((t, i) => (
          <StatusPill
            key={t.value}
            label={t.label}
            count={countMap.get(t.value) ?? 0}
            active={status === t.value}
            onClick={() => set("status", t.value)}
            first={i === 0}
          />
        ))}
      </div>
    </div>
  );
}

function StatusPill({
  label,
  count,
  active,
  onClick,
  first,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  first?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground",
        !first && "ml-1",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-primary" : "bg-muted-foreground/40",
        )}
      />
      {label}
      <span className={cn("font-mono text-[10px]", active ? "text-primary/80" : "text-muted-foreground/60")}>
        {count}
      </span>
    </button>
  );
}
