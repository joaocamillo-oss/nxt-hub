"use client";

import { useDraggable } from "@dnd-kit/core";
import Link from "next/link";
import type { DealWithCompany } from "@/lib/deals/queries";

type Props = {
  orgSlug: string;
  deal: DealWithCompany;
};

// Gera uma cor de avatar determinística baseada no nome
const AVATAR_COLORS = [
  ["#4f46e5", "#e0e7ff"], // indigo
  ["#0891b2", "#cffafe"], // cyan
  ["#059669", "#d1fae5"], // emerald
  ["#d97706", "#fef3c7"], // amber
  ["#dc2626", "#fee2e2"], // red
  ["#7c3aed", "#ede9fe"], // violet
  ["#db2777", "#fce7f3"], // pink
  ["#0284c7", "#e0f2fe"], // sky
];

function avatarColors(name: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const pair = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
  return { bg: pair[1]!, text: pair[0]! };
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatBrl(value: number | null): string {
  if (value === null) return "";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  });
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

export function KanbanCard({ orgSlug, deal }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const colors = avatarColors(deal.name);
  const ini = initials(deal.name);
  const value = formatBrl(deal.value);
  const ago = timeAgo(deal.created_at);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border border-border bg-card shadow-xs transition-all ${
        isDragging ? "opacity-40 shadow-lg" : "hover:border-primary/30 hover:shadow-sm"
      }`}
    >
      {/* drag handle strip — topo do card */}
      <button
        type="button"
        {...listeners}
        {...attributes}
        aria-label="Arrastar para mover"
        className="flex w-full cursor-grab items-center justify-center py-1 opacity-0 group-hover:opacity-100 active:cursor-grabbing"
      >
        <span className="h-1 w-8 rounded-full bg-border" />
      </button>

      <Link href={`/app/${orgSlug}/deals/${deal.id}`} className="block px-3 pb-3">
        {/* Avatar + nome + tempo */}
        <div className="flex items-start gap-2.5">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
            style={{ background: colors.bg, color: colors.text }}
          >
            {ini}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-1">
              <span className="truncate text-[13px] font-semibold leading-tight text-foreground">
                {deal.name}
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground">{ago}</span>
            </div>
            <p className="truncate text-[11px] text-muted-foreground">{deal.companyName}</p>
          </div>
        </div>

        {/* Notas como preview */}
        {deal.notes && (
          <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
            {deal.notes}
          </p>
        )}

        {/* Footer: valor + data */}
        <div className="mt-2.5 flex items-center gap-1.5">
          {value && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              {value}
            </span>
          )}
          {deal.expected_close_date && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              {deal.expected_close_date}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
