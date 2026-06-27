create type public.prazo_tipo as enum (
  'recurso',
  'contestacao',
  'manifestacao',
  'impugnacao',
  'embargos',
  'apelacao',
  'agravo',
  'peticao_inicial',
  'outro'
);

create type public.prazo_status as enum (
  'pendente',
  'cumprido',
  'perdido'
);

create table public.prazos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  processo_id uuid references public.processos(id) on delete cascade,

  titulo text not null,
  tipo public.prazo_tipo not null default 'outro',
  status public.prazo_status not null default 'pendente',

  data_prazo date not null,
  dias_uteis_prazo integer, -- referência de quantos dias úteis o prazo original tinha

  responsavel_id uuid references auth.users(id) on delete set null,
  observacoes text,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index prazos_organization_id_idx on public.prazos(organization_id);
create index prazos_processo_id_idx on public.prazos(processo_id);
create index prazos_data_prazo_idx on public.prazos(data_prazo);
create index prazos_status_idx on public.prazos(status);

alter table public.prazos enable row level security;

create policy "members read"
  on public.prazos for select
  using (public.is_org_member(organization_id));

create policy "members insert"
  on public.prazos for insert
  with check (public.is_org_member(organization_id) and auth.uid() = created_by);

create policy "members update"
  on public.prazos for update
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "admins delete"
  on public.prazos for delete
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

create trigger prazos_set_updated_at
  before update on public.prazos
  for each row execute function public.set_updated_at();

create trigger prazos_freeze_org_and_creator
  before update on public.prazos
  for each row execute function public.freeze_org_and_creator();
