# Projeto-Mãe Agendamento

Template white-label de agendamento (Next.js + Supabase) para negócios que trabalham com horário marcado — barbearias, clínicas odontológicas, clínicas de estética, salões de beleza e afins.

Não é um SaaS multi-tenant: é um **projeto-base** que se duplica e personaliza a cada novo cliente fechado. Ver [CUSTOMIZATION.md](CUSTOMIZATION.md) para o passo a passo completo de como transformar este projeto-mãe no projeto de um cliente específico.

## Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui (Base UI), Lucide Icons
- **Backend:** Server Actions + Server Components, TypeScript
- **Banco:** Supabase (PostgreSQL) com Row Level Security
- **Validação:** Zod
- **Formulários:** React Hook Form + `@hookform/resolvers/zod`
- **Testes:** Vitest

## O que já vem pronto (MVP)

- Site institucional (início, serviços, sobre, contato)
- Fluxo de agendamento público (serviço → profissional → horário → confirmação)
- Login/cadastro de clientes + área do cliente (meus agendamentos, cancelar)
- Painel administrativo: dashboard, agenda (com agendamento manual), gestão de serviços, gestão de profissionais (com horários de trabalho), configuração de horário de funcionamento
- Controle de acesso por papel (admin / atendente / cliente)
- Identidade centralizada em [`lib/config/company-config.ts`](lib/config/company-config.ts) — nada de nome/telefone/cor espalhado pelo código

O que fica para uma fase seguinte está documentado em [CUSTOMIZATION.md § 7](CUSTOMIZATION.md#7-limitações-conhecidas-do-mvp-fase-1).

## Como rodar localmente

```bash
npm install
cp .env.example .env.local
```

Preencha `.env.local` com as credenciais de um projeto Supabase (crie um em [supabase.com](https://supabase.com)), depois rode as migrations em `supabase/migrations/` (em ordem) contra esse projeto — pelo SQL editor do painel do Supabase ou pela Supabase CLI.

```bash
npm run dev
```

Promova sua conta a `admin` (ver [CUSTOMIZATION.md § 4](CUSTOMIZATION.md#4-papéis-e-permissões-rbac)) para acessar `/admin`.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm test` | Testes (Vitest) |
| `npm run typecheck` | Checagem de tipos |
| `npm run lint` | ESLint |

## Estrutura

```
app/
  (site)/        site institucional público + fluxo de agendamento
  (auth)/        login / cadastro
  (cliente)/     área do cliente autenticado
  admin/         painel administrativo (admin + atendente)
lib/
  booking/       motor de disponibilidade — função pura, sem dependências externas
  config/        identidade centralizada do cliente (company-config.ts)
  supabase/      clients Supabase (browser / server / admin) + middleware de sessão
  validations/   schemas Zod por domínio
services/        camada de acesso a dados (repositórios), por domínio
supabase/migrations/  schema + RLS, em ordem
tests/           testes Vitest
```

Ver [CUSTOMIZATION.md](CUSTOMIZATION.md) para o mapa completo de "o que muda por cliente e onde editar".
