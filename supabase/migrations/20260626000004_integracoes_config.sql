-- Configuração Advbox por organização
create table public.advbox_config (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  api_key_enc text not null,
  subdomain text not null, -- ex: "escritorio" para escritorio.advbox.com.br
  last_sync_at timestamptz,
  sync_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.advbox_config enable row level security;

create policy "admins only"
  on public.advbox_config for all
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

create trigger advbox_config_set_updated_at
  before update on public.advbox_config
  for each row execute function public.set_updated_at();

-- Log de sincronizações
create table public.advbox_sync_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running', -- running | success | error
  processos_criados integer not null default 0,
  processos_atualizados integer not null default 0,
  erro text,
  created_at timestamptz not null default now()
);

create index advbox_sync_logs_org_idx on public.advbox_sync_logs(organization_id);

alter table public.advbox_sync_logs enable row level security;

create policy "admins read"
  on public.advbox_sync_logs for select
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

create policy "admins insert"
  on public.advbox_sync_logs for insert
  with check (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

create policy "admins update"
  on public.advbox_sync_logs for update
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

-- Coluna para rastrear origem do processo (manual | advbox)
alter table public.processos
  add column if not exists source text not null default 'manual',
  add column if not exists advbox_id text,
  add column if not exists advbox_synced_at timestamptz;

create unique index if not exists processos_advbox_id_org_idx
  on public.processos(organization_id, advbox_id)
  where advbox_id is not null;
