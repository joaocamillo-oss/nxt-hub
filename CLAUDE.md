# CLAUDE.md — NXT Hub

Esse arquivo orienta o Claude Code quando ele trabalha neste projeto.

## O que é esse projeto

CRM jurídico all-in-one para escritórios de advocacia brasileiros. Construído sobre um template SaaS multi-tenant em Next.js 16 + Supabase. O objetivo é superar Guimoo, Advbox e Lexfy em funcionalidades dentro de um único workspace jurídico.

**Fora do escopo:** RDStation (removido). Não mencionar, não implementar.

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript strict
- **Banco:** Supabase Cloud (PostgreSQL + RLS + Auth + Storage)
- **UI:** shadcn/ui (base-nova preset, sobre `@base-ui/react`) + Tailwind CSS 4 (CSS variables, tema escuro com accent azul jurídico)
- **Forms:** React Hook Form + Zod + componentes shadcn Form (wrapper em `components/forms/`)
- **Data:** Server Components + Server Actions (sem TanStack Query nesta versão)
- **Charts:** Recharts via shadcn/ui Chart
- **Lint/Format:** Biome
- **Package manager:** npm

## Vocabulário do domínio jurídico

| Termo técnico | Termo jurídico usado na UI |
|---|---|
| deal / oportunidade | Lead / Caso |
| contact | Cliente ou Lead |
| company | Empresa (parte contrária ou empregadora) |
| stage / estágio do funil | Etapa |
| task | Tarefa |
| inbox / conversa | Atendimento |
| agent | Agente de IA |
| organization / org | Escritório |

## Módulos — o que já existe vs o que falta

### ✅ Já construído (herança do template — não recriar)

| Módulo | Localização |
|---|---|
| Auth (login, signup, OAuth, reset, convites) | `app/(auth)/`, `lib/auth/` |
| Multi-tenant (organizações, membros, permissões, RLS) | `lib/orgs/`, `lib/members/`, `lib/invitations/` |
| CRM base: Contatos, Empresas, Deals (Kanban), Tarefas | `lib/contacts/`, `lib/companies/`, `lib/deals/` |
| WhatsApp multi-canal (inbox Realtime, broadcast SQL) | `lib/messaging/`, `app/.../inbox/` |
| Agentes de IA com RAG, tool use, handoff humano | `lib/agent/` |
| Automações event-based (7 gatilhos, 14 ações, engine) | `lib/automations/` |
| Tags universais (contatos, deals, conversas) | `lib/tags/` |
| Documentos/uploads (Supabase Storage) | `lib/companies/`, `lib/deals/` |
| Dashboard com KPIs e gráficos | `app/.../dashboard/` |
| Background jobs com recovery | `lib/jobs/` |
| Email transacional (Supabase/Resend) | `lib/email/` |
| LLM abstrato (Anthropic/OpenAI) | `lib/llm/` |

### ❌ A construir (domínio jurídico)

| Módulo | Prioridade | Descrição |
|---|---|---|
| **Processos judiciais** | P1 | Número CNJ, tribunal, vara, comarca, fase, polo ativo/passivo, valor da causa, advogado responsável, vinculação a cliente |
| **Movimentações processuais** | P1 | Timeline de andamentos, upload de petições, marcação de intimações |
| **Prazos** | P1 | Calendário de prazos processuais, cálculo em dias úteis, alertas D-15/7/3/1/0, semáforo visual |
| **Honorários** | P2 | Tipo (fixo/êxito/misto/hora), valor, parcelas, vinculação a processo |
| **Integração Asaas** | P2 | Cobranças PIX/boleto/cartão, webhook de confirmação, régua de cobrança automática |
| **Integração ZapSign** | P2 | Geração de contrato PDF, envio para assinatura, webhook de status |
| **Agentes jurídicos** | P2 | Templates de agente por tese (BPC/LOAS, Trabalhista, Previdenciário, Cível) |
| **Automações jurídicas** | P2 | Templates pré-prontos: "prazo em 7 dias → tarefa + WhatsApp", "contrato assinado → cobrança", etc. |
| **Dashboard jurídico** | P3 | Widgets reais: prazos urgentes, processos por fase, receita prevista, leads sem contato |
| **Teses jurídicas** | P3 | Campo tese em leads/processos com as teses mais comuns pré-definidas |
| **Funil jurídico** | P3 | Estágios específicos: Lead → Triagem → Consulta → Proposta → Contrato → Cliente Ativo → Perdido |

## Convenções

1. **PT-BR em UI / docs / mensagens.** Código (vars, funções, arquivos, tabelas, colunas) em inglês.
2. **Arquivos:** kebab-case. **Componentes React:** PascalCase. **Vars/funções:** camelCase. **Tabelas/colunas:** snake_case.
3. **Toda página em `/app/[orgSlug]/` começa com `requireOrgMember`** (ou `requireOrgRole`). Ver `lib/auth/CLAUDE.md`.
4. **Server Actions retornam `{ ok: true; data?: T } | { ok: false; error: string }`.** Nunca jogue exception sem tratamento.
5. **Padrão de slot do shadcn aqui é `render={<X />}`**, NÃO `asChild`:
   ```tsx
   <Button render={<Link href="/x" />}>Texto</Button>
   ```
6. **Todo input valida com Zod** antes de tocar banco.

## Regras absolutas (violar = bug crítico)

### Banco / segurança
1. **Toda tabela de domínio tem `organization_id`** + RLS habilitada + policies usando `is_org_member` / `has_org_role`. Sem exceção.
2. **NÃO usar `FORCE ROW LEVEL SECURITY`** — causa recursão infinita. `ENABLE` é suficiente.
3. **`SUPABASE_SERVICE_ROLE_KEY` nunca em código que roda no browser.**
4. **Server Actions NUNCA retornam `error.message` direto** do Postgres — traduz pra mensagem em PT-BR, loga server-side.
5. **Uploads validam por MIME (magic bytes)**, não pela extensão do arquivo.
6. **Aprovação humana antes de migrations destrutivas** (drop column, drop table).

### Auth
7. **Senhas mínimo 10 caracteres.**
8. **Signup nunca confirma se email já existe** — retorna sucesso genérico.

### React + Next.js
9. **Server vs Client boundary é real.** Hooks e event handlers só em Client Component (`"use client"`).
10. **`page.tsx` é Server.** Componentes interativos em `*-form.tsx`, `*-table.tsx` com `"use client"`.

### TypeScript
11. **NUNCA use `any`.**
12. **Tipos do Supabase vêm de `types/supabase.ts`** — após mudar schema, rode `npm run types`.

## Verificação obrigatória antes de dizer "feito"

```bash
npx tsc --noEmit   # 0 erros
npm run build      # build completa
```

## Comandos npm

- `npm run dev` — server local em http://localhost:3000
- `npm run build` — build de produção
- `npm run check` — Biome lint + format
- `npm run types` — regenera `types/supabase.ts` do schema remoto
- `npm run test` — testes Vitest

## Estrutura relevante

```
app/
  (auth)/                         # Login, signup, reset, OAuth callback
  (app)/
    onboarding/                   # Criar primeiro escritório
    app/[orgSlug]/                # Autenticado, escopado por org
      dashboard/                  # KPIs e gráficos
      inbox/                      # WhatsApp multi-atendimento
      tarefas/                    # Tarefas
      contatos/                   # Clientes e leads (pessoas)
      empresas/                   # Empresas (partes contrárias, empregadoras)
      deals/                      # Kanban de captação (leads → clientes)
      processos/                  # ❌ A criar — processos judiciais
      prazos/                     # ❌ A criar — calendário de prazos
      financeiro/                 # ❌ A criar — honorários + Asaas
      automacoes/                 # Automações event-based
      settings/                   # Agentes IA, canais WhatsApp, membros, etc.
lib/
  processos/                      # ❌ A criar — queries + actions + schemas
  prazos/                         # ❌ A criar
  financeiro/                     # ❌ A criar
  asaas/                          # ❌ A criar — adapter de integração
  zapsign/                        # ❌ A criar — adapter de integração
  contacts/                       # ✅ Clientes/leads
  companies/                      # ✅ Empresas
  deals/                          # ✅ Kanban de captação
  messaging/                      # ✅ WhatsApp multi-canal
  agent/                          # ✅ Agentes IA com RAG
  automations/                    # ✅ Automações event-based
supabase/
  migrations/                     # Migrations SQL em ordem cronológica
```

## Integrações externas — status e onde ficam

| Integração | Status | Localização |
|---|---|---|
| WhatsApp (Evolution API / Cloud API) | ✅ funcionando | `lib/messaging/adapters/` |
| OpenAI / Anthropic (IA + RAG) | ✅ funcionando | `lib/llm/`, `lib/agent/` |
| Supabase Auth + Storage | ✅ funcionando | `lib/supabase/` |
| Email (Resend / Supabase) | ✅ funcionando | `lib/email/` |
| **Asaas** (cobranças) | ❌ a implementar | `lib/asaas/` |
| **ZapSign** (assinatura digital) | ❌ a implementar | `lib/zapsign/` |

## CLAUDE.md filhos (consulte conforme contexto)

**Infra:**
- `lib/auth/CLAUDE.md` — guards, proteção de rota
- `lib/supabase/CLAUDE.md` — queries, migrations, RLS
- `lib/email/CLAUDE.md` — envio de email
- `lib/llm/CLAUDE.md` — adapters Anthropic/OpenAI
- `lib/jobs/CLAUDE.md` — background jobs

**Subsistemas:**
- `lib/messaging/CLAUDE.md` — inbox WhatsApp, router, adapters
- `lib/agent/CLAUDE.md` — agente IA, RAG, tools, handoff
- `lib/automations/CLAUDE.md` — automações event-based

**Domínios CRM (seguem padrão de `lib/tasks/`):**
- `lib/contacts/CLAUDE.md`, `lib/companies/CLAUDE.md`, `lib/deals/CLAUDE.md`

## Diretório de referência

Quando precisar de modelo concreto:
- `lib/tasks/` — CRUD completo (queries + actions + schemas)
- `app/(app)/app/[orgSlug]/tarefas/` — página com DataTable + detail + dialog
- `supabase/migrations/_TEMPLATE_org_scoped_table.sql.example` — template SQL

## Anti-padrões (PROIBIDO)

- ❌ "Acho que tá funcionando" sem rodar typecheck + build
- ❌ Try/catch só pra esconder erro
- ❌ `any` no TypeScript
- ❌ Deixar `console.log` depois de debugar
- ❌ Push pra main sem permissão
- ❌ Mencionar ou implementar RDStation (fora do escopo)
