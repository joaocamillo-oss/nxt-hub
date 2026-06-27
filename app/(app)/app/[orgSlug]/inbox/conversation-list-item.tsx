"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { resolveConversationDisplay } from "./contact-display";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Conversation {
  id: string;
  external_thread_id: string;
  display_name: string | null;
  status: string;
  unread_count: number;
  last_message_at: string | null;
  channel: { id: string; type: string; name: string } | null;
  contact: { id: string; name: string; phone: string | null } | null;
  tags?: { tag: Tag | null }[];
  preview?: string | null;
}

interface Props {
  orgSlug: string;
  c: Conversation;
  selected: boolean;
}

// Gera cor de avatar determinística pelo nome
const AVATAR_PALETTE = [
  { bg: "#e0e7ff", text: "#4f46e5" },
  { bg: "#cffafe", text: "#0891b2" },
  { bg: "#d1fae5", text: "#059669" },
  { bg: "#fef3c7", text: "#d97706" },
  { bg: "#fee2e2", text: "#dc2626" },
  { bg: "#ede9fe", text: "#7c3aed" },
  { bg: "#fce7f3", text: "#db2777" },
  { bg: "#e0f2fe", text: "#0284c7" },
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]!;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
  if (d < 30) return `${d}d`;
  return `${Math.floor(d / 30)}m`;
}

const STATUS_LABEL: Record<string, string> = {
  open: "Aberta",
  pending: "Pendente",
  resolved: "Resolvida",
};

const STATUS_COLOR: Record<string, string> = {
  open: "bg-emerald-500/15 text-emerald-600",
  pending: "bg-amber-500/15 text-amber-600",
  resolved: "bg-zinc-500/15 text-zinc-500",
};

const CHANNEL_ICON: Record<string, string> = {
  whatsapp_cloud: "📱",
  whatsapp_evolution: "📱",
  instagram_dm: "📷",
  telegram: "✈️",
  sms: "💬",
  mock: "🤖",
};

export function ConversationListItem({ orgSlug, c, selected }: Props) {
  const display = resolveConversationDisplay(c);
  const displayName = display.name ?? "Sem nome";
  const colors = avatarColor(displayName);
  const ini = initials(displayName);
  const ago = timeAgo(c.last_message_at);
  const tags = (c.tags ?? []).map((t) => t.tag).filter((t): t is Tag => t !== null);
  const channelEmoji = c.channel ? (CHANNEL_ICON[c.channel.type] ?? "💬") : null;

  return (
    <Link
      href={`/app/${orgSlug}/inbox/${c.id}`}
      className={cn(
        "group flex gap-3 border-b border-border/50 px-3 py-3 transition-colors",
        selected
          ? "bg-primary/5 border-l-2 border-l-primary"
          : "border-l-2 border-l-transparent hover:bg-muted/40",
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-bold"
          style={{ background: colors.bg, color: colors.text }}
        >
          {ini}
        </div>
        {c.unread_count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
            {c.unread_count > 99 ? "99+" : c.unread_count}
          </span>
        )}
      </div>

      {/* Conteúdo */}
      <div className="min-w-0 flex-1">
        {/* Linha 1: nome + tempo */}
        <div className="flex items-baseline justify-between gap-1">
          <span className={cn("truncate text-[13px] font-semibold leading-tight", selected ? "text-primary" : "text-foreground")}>
            {displayName}
          </span>
          <span className="shrink-0 text-[10px] text-muted-foreground">{ago}</span>
        </div>

        {/* Linha 2: telefone */}
        {c.contact?.phone && (
          <p className="text-[11px] text-muted-foreground/70">{c.contact.phone}</p>
        )}

        {/* Linha 3: preview */}
        {c.preview && (
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
            {c.preview}
          </p>
        )}

        {/* Linha 4: badges */}
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {/* Canal */}
          {c.channel && (
            <span className="flex items-center gap-0.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {channelEmoji} {c.channel.name}
            </span>
          )}

          {/* Status */}
          <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", STATUS_COLOR[c.status] ?? "bg-muted text-muted-foreground")}>
            {STATUS_LABEL[c.status] ?? c.status}
          </span>

          {/* Tags */}
          {tags.slice(0, 2).map((t) => (
            <span
              key={t.id}
              className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
              style={{ background: t.color }}
            >
              {t.name}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{tags.length - 2}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
