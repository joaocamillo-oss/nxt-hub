-- Múltiplos funis de CRM por org, cada um opcionalmente vinculado a um canal WhatsApp.

create table public.pipelines (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel_id      uuid references public.channels(id) on delete set null,
  name            text not null check (length(name) between 1 and 100),
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Apenas um funil padrão por org
create unique index pipelines_org_default_idx
  on public.pipelines(organization_id)
  where is_default = true;

create index pipelines_org_idx on public.pipelines(organization_id);
create index pipelines_channel_idx on public.pipelines(channel_id);

alter table public.pipelines enable row level security;

create policy "pipelines: members read"
  on public.pipelines for select
  using (public.is_org_member(organization_id));

create policy "pipelines: admins insert"
  on public.pipelines for insert
  with check (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]));

create policy "pipelines: admins update"
  on public.pipelines for update
  using (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]));

create policy "pipelines: admins delete"
  on public.pipelines for delete
  using (public.has_org_role(organization_id, array['owner','admin']::public.org_role[]));

create trigger pipelines_set_updated_at
  before update on public.pipelines
  for each row execute function public.set_updated_at();

-- Adiciona pipeline_id em deals
alter table public.deals
  add column pipeline_id uuid references public.pipelines(id) on delete set null;

create index deals_pipeline_id_idx on public.deals(pipeline_id);

-- Função que garante um funil padrão ao criar a org (chamada via trigger em organizations)
-- e cria o funil padrão para deals existentes sem pipeline.
-- A criação do funil padrão é feita via Server Action no onboarding / migration de dados.
