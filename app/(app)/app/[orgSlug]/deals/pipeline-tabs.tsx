"use client";

import {
  MessageSquareIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPipelineAction,
  deletePipelineAction,
  updatePipelineAction,
  type Pipeline,
} from "@/lib/deals/pipelines";

type ChannelOption = { id: string; name: string };

type Props = {
  orgSlug: string;
  pipelines: Pipeline[];
  activePipelineId: string | null;
  channels: ChannelOption[];
  isAdmin: boolean;
};

export function PipelineTabs({
  orgSlug,
  pipelines,
  activePipelineId,
  channels,
  isAdmin,
}: Props) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-border/60 pb-0">
      {pipelines.map((p) => (
        <PipelineTab
          key={p.id}
          pipeline={p}
          orgSlug={orgSlug}
          isActive={p.id === activePipelineId}
          channels={channels}
          isAdmin={isAdmin}
        />
      ))}
      {isAdmin && (
        <NewPipelineDialog orgSlug={orgSlug} channels={channels} />
      )}
    </div>
  );
}

function PipelineTab({
  pipeline,
  orgSlug,
  isActive,
  channels,
  isAdmin,
}: {
  pipeline: Pipeline;
  orgSlug: string;
  isActive: boolean;
  channels: ChannelOption[];
  isAdmin: boolean;
}) {
  const href = `/app/${orgSlug}/deals?pipeline=${pipeline.id}`;

  return (
    <div
      className={`group flex shrink-0 items-center gap-1 border-b-2 px-3 py-2 transition-colors ${
        isActive
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {pipeline.channelName && (
        <MessageSquareIcon className="h-3 w-3 shrink-0 text-muted-foreground/60" />
      )}
      <Link
        href={href}
        className="text-sm font-medium leading-none"
        prefetch={false}
      >
        {pipeline.name}
      </Link>
      {isAdmin && (
        <PipelineMenu pipeline={pipeline} orgSlug={orgSlug} channels={channels} />
      )}
    </div>
  );
}

function PipelineMenu({
  pipeline,
  orgSlug,
  channels,
}: {
  pipeline: Pipeline;
  orgSlug: string;
  channels: ChannelOption[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  function handleDelete() {
    if (!confirm(`Excluir funil "${pipeline.name}"? Os deals ficarão sem funil.`)) return;
    start(async () => {
      const r = await deletePipelineAction(orgSlug, pipeline.id);
      if (!r.ok) toast.error(r.error);
      else {
        toast.success("Funil excluído");
        router.push(`/app/${orgSlug}/deals`);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Opções do funil"
            />
          }
        >
          <MoreHorizontalIcon className="h-3 w-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setEditOpen(true)}>
              <PencilIcon className="mr-2 h-3.5 w-3.5" />
              Editar funil
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={handleDelete}
              disabled={pending || pipeline.is_default}
              className="text-destructive focus:text-destructive"
            >
              <Trash2Icon className="mr-2 h-3.5 w-3.5" />
              {pipeline.is_default ? "Funil padrão (não excluível)" : "Excluir funil"}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditPipelineDialog
        pipeline={pipeline}
        orgSlug={orgSlug}
        channels={channels}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

function EditPipelineDialog({
  pipeline,
  orgSlug,
  channels,
  open,
  onOpenChange,
}: {
  pipeline: Pipeline;
  orgSlug: string;
  channels: ChannelOption[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [name, setName] = useState(pipeline.name);
  const [channelId, setChannelId] = useState<string>(pipeline.channel_id ?? "__none__");
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await updatePipelineAction({
        orgSlug,
        id: pipeline.id,
        name,
        channelId: channelId === "__none__" ? null : channelId,
      });
      if (!r.ok) toast.error(r.error);
      else {
        toast.success("Funil atualizado");
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar funil</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-pipeline-name">Nome</Label>
            <Input
              id="edit-pipeline-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Canal WhatsApp vinculado</Label>
            <Select value={channelId} onValueChange={(v) => { if (v) setChannelId(v); }}>
              <SelectTrigger>
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhum</SelectItem>
                {channels.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Leads que chegam por esse canal entram automaticamente neste funil.
            </p>
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewPipelineDialog({
  orgSlug,
  channels,
}: {
  orgSlug: string;
  channels: ChannelOption[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [channelId, setChannelId] = useState("__none__");
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await createPipelineAction({
        orgSlug,
        name,
        channelId: channelId === "__none__" ? undefined : channelId,
      });
      if (!r.ok) toast.error(r.error);
      else {
        toast.success("Funil criado");
        setName("");
        setChannelId("__none__");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="mb-0.5 h-7 gap-1 text-muted-foreground"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Novo funil
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo funil</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-pipeline-name">Nome do funil</Label>
            <Input
              id="new-pipeline-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: BPC/LOAS, Trabalhista..."
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Canal WhatsApp vinculado</Label>
            <Select value={channelId} onValueChange={(v) => { if (v) setChannelId(v); }}>
              <SelectTrigger>
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhum</SelectItem>
                {channels.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              Leads que chegam por esse canal entram automaticamente neste funil.
            </p>
          </div>
          <Button type="submit" disabled={pending || !name.trim()} className="w-full">
            {pending ? "Criando..." : "Criar funil"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
