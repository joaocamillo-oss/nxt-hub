-- Enums do domínio jurídico
create type public.processo_fase as enum (
  'conhecimento',
  'recursal',
  'execucao',
  'arquivado'
);

create type public.processo_status as enum (
  'ativo',
  'suspenso',
  'encerrado',
  'arquivado'
);

create type public.processo_tipo as enum (
  'previdenciario',
  'trabalhista',
  'civel',
  'criminal',
  'tributario',
  'administrativo',
  'familia',
  'outro'
);

create table public.processos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,

  -- identificação
  numero_cnj text not null,
  tribunal text not null,
  vara text,
  comarca text,

  -- classificação
  tipo public.processo_tipo not null default 'civel',
  fase public.processo_fase not null default 'conhecimento',
  status public.processo_status not null default 'ativo',

  -- partes
  polo_ativo text not null,
  polo_passivo text not null,

  -- valor e datas
  valor_causa numeric(15,2),
  data_distribuicao date,
  data_encerramento date,

  -- vínculos internos
  contact_id uuid references public.contacts(id) on delete set null,
  responsavel_id uuid references auth.users(id) on delete set null,

  -- extra
  observacoes text,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index processos_organization_id_idx on public.processos(organization_id);
create index processos_contact_id_idx on public.processos(contact_id);
create index processos_numero_cnj_idx on public.processos(numero_cnj);
create index processos_status_idx on public.processos(status);

alter table public.processos enable row level security;

create policy "members read"
  on public.processos for select
  using (public.is_org_member(organization_id));

create policy "members insert"
  on public.processos for insert
  with check (public.is_org_member(organization_id) and auth.uid() = created_by);

create policy "members update"
  on public.processos for update
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "admins delete"
  on public.processos for delete
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

create trigger processos_set_updated_at
  before update on public.processos
  for each row execute function public.set_updated_at();

create trigger processos_freeze_org_and_creator
  before update on public.processos
  for each row execute function public.freeze_org_and_creator();

-- Movimentações processuais (timeline de andamentos)
create table public.movimentacoes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  processo_id uuid not null references public.processos(id) on delete cascade,

  data_movimentacao date not null,
  descricao text not null,
  tipo text not null default 'andamento', -- andamento | intimacao | despacho | sentenca | acordao | peticao
  is_intimacao boolean not null default false,
  prazo_dias integer, -- dias úteis para resposta (se intimação)

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index movimentacoes_processo_id_idx on public.movimentacoes(processo_id);
create index movimentacoes_organization_id_idx on public.movimentacoes(organization_id);

alter table public.movimentacoes enable row level security;

create policy "members read"
  on public.movimentacoes for select
  using (public.is_org_member(organization_id));

create policy "members insert"
  on public.movimentacoes for insert
  with check (public.is_org_member(organization_id) and auth.uid() = created_by);

create policy "members update"
  on public.movimentacoes for update
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "admins delete"
  on public.movimentacoes for delete
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));
