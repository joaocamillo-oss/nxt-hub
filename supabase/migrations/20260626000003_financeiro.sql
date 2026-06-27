-- Tipos de honorários e cobranças
create type public.honorario_tipo as enum (
  'fixo',
  'exito',
  'misto',
  'hora'
);

create type public.honorario_status as enum (
  'ativo',
  'encerrado',
  'cancelado'
);

create type public.parcela_status as enum (
  'pendente',
  'pago',
  'vencido',
  'cancelado'
);

create type public.cobranca_metodo as enum (
  'pix',
  'boleto',
  'cartao_credito',
  'transferencia',
  'dinheiro',
  'outro'
);

-- Contrato de honorários
create table public.honorarios (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  processo_id uuid references public.processos(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,

  tipo public.honorario_tipo not null,
  status public.honorario_status not null default 'ativo',

  -- Valores
  valor_total numeric(15,2) not null,
  valor_exito numeric(15,2), -- para tipo misto ou exito: percentual ou valor fixo
  percentual_exito numeric(5,2), -- 0.00-100.00

  -- Parcelamento
  num_parcelas integer not null default 1,

  descricao text,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index honorarios_organization_id_idx on public.honorarios(organization_id);
create index honorarios_processo_id_idx on public.honorarios(processo_id);
create index honorarios_contact_id_idx on public.honorarios(contact_id);

alter table public.honorarios enable row level security;

create policy "members read"
  on public.honorarios for select
  using (public.is_org_member(organization_id));

create policy "members insert"
  on public.honorarios for insert
  with check (public.is_org_member(organization_id) and auth.uid() = created_by);

create policy "members update"
  on public.honorarios for update
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "admins delete"
  on public.honorarios for delete
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

create trigger honorarios_set_updated_at
  before update on public.honorarios
  for each row execute function public.set_updated_at();

create trigger honorarios_freeze_org_and_creator
  before update on public.honorarios
  for each row execute function public.freeze_org_and_creator();

-- Parcelas dos honorários
create table public.parcelas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  honorario_id uuid not null references public.honorarios(id) on delete cascade,

  numero integer not null, -- 1, 2, 3...
  valor numeric(15,2) not null,
  data_vencimento date not null,
  status public.parcela_status not null default 'pendente',
  metodo_pagamento public.cobranca_metodo,

  data_pagamento date,
  valor_pago numeric(15,2),

  -- Asaas
  asaas_payment_id text unique,
  asaas_invoice_url text,
  asaas_pix_qr_code text,
  asaas_pix_copy_paste text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index parcelas_honorario_id_idx on public.parcelas(honorario_id);
create index parcelas_organization_id_idx on public.parcelas(organization_id);
create index parcelas_status_idx on public.parcelas(status);
create index parcelas_data_vencimento_idx on public.parcelas(data_vencimento);
create index parcelas_asaas_payment_id_idx on public.parcelas(asaas_payment_id);

alter table public.parcelas enable row level security;

create policy "members read"
  on public.parcelas for select
  using (public.is_org_member(organization_id));

create policy "members insert"
  on public.parcelas for insert
  with check (public.is_org_member(organization_id));

create policy "members update"
  on public.parcelas for update
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "admins delete"
  on public.parcelas for delete
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

create trigger parcelas_set_updated_at
  before update on public.parcelas
  for each row execute function public.set_updated_at();

-- Configuração Asaas por organização (credenciais guardadas de forma segura)
create table public.asaas_config (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  api_key_enc text not null, -- chave criptografada (ver lib/asaas/crypto.ts)
  environment text not null default 'sandbox', -- sandbox | production
  webhook_token text,
  asaas_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.asaas_config enable row level security;

create policy "admins only"
  on public.asaas_config for all
  using (public.has_org_role(organization_id, array['owner', 'admin']::public.org_role[]));

create trigger asaas_config_set_updated_at
  before update on public.asaas_config
  for each row execute function public.set_updated_at();
