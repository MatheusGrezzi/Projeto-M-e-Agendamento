# Reconnect OS

Sistema operacional interno da Reconnect — agência especializada em geração de leads para assistências técnicas de eletrodomésticos, refrigeração e climatização.

Não é um dashboard: é a base que padroniza os dados de cada cliente da agência (segmentos, equipamentos, serviços atendidos e **não atendidos**, marcas, regiões, landing pages, conversões) para que agentes de IA usem essas informações com segurança ao planejar, auditar e executar campanhas de Google Ads.

## Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui (Base UI), Lucide Icons
- **Backend:** Server Actions + Server Components, TypeScript
- **Banco:** Supabase (PostgreSQL) com Row Level Security, multiusuário/multiorganização
- **Validação:** Zod
- **Formulários:** React Hook Form + `@hookform/resolvers/zod`
- **Testes:** Vitest

## Fase 1 (atual)

- Autenticação (Supabase Auth) e organizações multiusuário
- Cadastro de clientes (empresas atendidas pela agência)
- Segmentos, equipamentos e serviços atendidos — com combinações flexíveis (equipamento + serviço)
- Equipamentos e serviços **não atendidos** (crítico para os futuros agentes de IA)
- Marcas atendidas / não atendidas / sem restrição
- Regiões atendidas, com prioridade, e regiões excluídas
- Landing pages e conversões por cliente
- Histórico de alterações (audit log) por cliente e por organização
- Dashboard com estatísticas reais de clientes + espaço reservado para métricas de campanha (Fase 2+)
- Navegação completa da Fase 2 em diante (Campanhas, Performance, Recomendações, Conhecimento, Aprendizados, Agentes) como placeholders "em breve"

As fases seguintes (motor de campanhas com agentes de IA, auditoria, aprovação humana, execução, QA, base de conhecimento, aprendizados, performance e benchmarks) estão descritas no planejamento do produto e serão implementadas incrementalmente.

## Como rodar localmente

```bash
npm install
cp .env.example .env.local
```

Preencha `.env.local` com as credenciais de um projeto Supabase (crie um em [supabase.com](https://supabase.com)), depois rode as migrations em `supabase/migrations/` (em ordem) contra esse projeto — pelo SQL editor do painel do Supabase ou pela Supabase CLI.

```bash
npm run dev
```

Crie sua conta em `/login` via Supabase Auth (Dashboard → Authentication → Add user, ou habilite signup). O primeiro usuário criado se torna automaticamente `owner` da organização "Reconnect" (seedada pela migration); os seguintes entram como `member`.

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
  login/                       autenticação
  (app)/                       área autenticada (sidebar completa)
    clientes/                  lista + onboarding + página do cliente (14 abas)
    campanhas, performance...  placeholders das fases seguintes
lib/
  config/                      —
  supabase/                    clients Supabase (browser / server / admin) + middleware de sessão
  validations/                 schemas Zod por domínio
  mappers.ts                   conversão snake_case (DB) → camelCase (app)
services/                      camada de acesso a dados (repositórios), por domínio
supabase/migrations/           schema + RLS, em ordem
tests/                         testes Vitest
```
