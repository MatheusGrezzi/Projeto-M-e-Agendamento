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

## Fase 2 (atual)

- **Motor de campanhas**: assistente em 10 passos (`/campanhas/nova`) — cliente ativo → segmento → equipamentos → serviços → regiões (com prioridade; regiões excluídas aparecem mas não são selecionáveis) → conversões → orçamento (com estimativa mensal = diário × 30,4) → objetivo (sinaliza se não há conversão compatível) → landing pages relevantes → revisão completa. Cada passo só mostra o que o cliente tem cadastrado.
- **CampaignContextBuilder** (`lib/agents/campaign-context.ts`): serviço de domínio único que consolida cliente, segmento, equipamentos/serviços selecionados e excluídos, marcas atendidas/não atendidas, regiões atendidas/excluídas, conversões, landing pages, orçamento e metas num objeto `CampaignContext` — a mesma estrutura que o futuro Auditor/Executor/QA vão reutilizar.
- **Validação determinística** (`lib/agents/campaign-validation.ts`) roda *antes* de qualquer chamada de IA: bloqueia (erro) serviço/equipamento/região excluídos, cliente inativo, orçamento ≤ 0, nenhum segmento/combinação selecionada; sinaliza (warning, não bloqueia) falta de landing page, conversão, ticket médio ou metas. Uma segunda passada (`validateGeneratedStrategy`) audita o próprio JSON gerado contra o contexto, como rede de segurança contra alucinação da IA.
- **CampaignStrategySchema** (`lib/schemas/campaign-strategy.ts`, Zod): contrato oficial `meta / campaign / bidding / locations / conversions / ad_groups / campaign_negatives / assets / warnings / assumptions / strategy_summary`. Palavras-chave positivas só aceitam `exact`/`phrase` (nunca `broad`); limites de caracteres de RSA (`lib/google-ads/limits.ts`) validados no schema, não espalhados pelo código.
- **Agente 01 — Estrategista** (`lib/agents/ai-provider.ts`): abstração `AIProvider` pluggable. Usa a **API da Anthropic (Claude)** de verdade quando `ANTHROPIC_API_KEY` está configurada (`lib/agents/anthropic-provider.ts`, prompt versionado em `lib/prompts/strategist-v1.ts`, chamada 100% server-side); cai automaticamente para um motor determinístico sem custo (`lib/agents/deterministic-provider.ts`) quando não há chave — zero configuração necessária para rodar. Uma correção estruturada é tentada automaticamente se a saída não bater com o schema; se continuar inválida, nada é salvo.
- **Palavras negativas contextuais, nunca universais**: derivadas das restrições de cada cliente (`client_excluded_equipment`/`client_excluded_services`) + um baseline genérico (DIY, cursos, manuais, vagas) — categorizadas (`parts`, `diy`, `employment`, `irrelevant_equipment`, `excluded_service`...) com motivo.
- **Versionamento** (`campaign_versions`) — cada geração/regeneração é um snapshot imutável; "Gerar nova versão" aceita um motivo opcional e nunca sobrescreve versões anteriores (seletor de versão na página da campanha).
- **Página de campanha** (`/campanhas/[id]`) com seções amigáveis (Resumo, Configuração, Localização, Conversões, Grupos de anúncio, Palavras-chave, Anúncios RSA, Negativas, Assets, Warnings, Assumptions) + botão "Ver JSON" para uso técnico. Indicador "Auditoria disponível na Fase 3" — Auditor intencionalmente não implementado ainda.

## Fase 1

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
