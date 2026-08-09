# CUSTOMIZATION.md

Este é um projeto-mãe: um template white-label de agendamento (Next.js + Supabase) para negócios que trabalham com horário marcado — barbearias, clínicas odontológicas, clínicas de estética, salões de beleza, etc.

**Filosofia:** o CORE (motor de agendamento, autenticação, dashboards, RLS) deve permanecer praticamente intocado entre clientes. Tudo que muda de cliente para cliente é identidade/conteúdo, concentrado em poucos lugares.

```
PROJETO-MÃE → DUPLICAR → PERSONALIZAR IDENTIDADE → CONFIGURAR CLIENTE → PUBLICAR
```

## 1. Checklist — novo cliente

- [ ] Duplicar este repositório (novo repositório no GitHub para o cliente)
- [ ] Criar um novo projeto Supabase (supabase.com/dashboard)
- [ ] Configurar `.env.local` a partir de `.env.example` (URL, anon key, service role key)
- [ ] Rodar as migrations, em ordem, contra o novo projeto (`supabase/migrations/*.sql`)
- [ ] Promover sua própria conta a `admin` (ver seção 5)
- [ ] Editar `lib/config/company-config.ts` (nome, tagline, contato, endereço, redes sociais, SEO, timezone)
- [ ] Substituir os arquivos em `/public/branding/` (logo, logo-dark, favicon, hero, og-image)
- [ ] Editar as cores em `app/globals.css` (blocos `:root` e `.dark`, valores oklch)
- [ ] Cadastrar serviços em `/admin/servicos`
- [ ] Cadastrar profissionais e seus horários de trabalho em `/admin/profissionais`
- [ ] Configurar o horário de funcionamento em `/admin/configuracoes`
- [ ] Adicionar depoimentos (via SQL direto na tabela `testimonials` — sem tela própria no MVP)
- [ ] Testar o fluxo completo (ver seção 6)
- [ ] Configurar domínio customizado
- [ ] Deploy

## 2. Onde cada coisa mora — mapa de identidade

| O que muda por cliente | Onde editar |
|---|---|
| Nome, tagline, descrição | `lib/config/company-config.ts` |
| Logo, favicon, imagem principal, OG image | `/public/branding/` + caminhos em `company-config.ts` |
| Cores (primária, secundária, destaque) | `app/globals.css` (`:root` / `.dark`) |
| Telefone, e-mail, WhatsApp, Instagram | `lib/config/company-config.ts` → `contact` |
| Endereço | `lib/config/company-config.ts` → `address` |
| SEO (título, descrição, URL do site) | `lib/config/company-config.ts` → `seo` |
| Fuso horário | `lib/config/company-config.ts` → `timezone` |
| Horário de funcionamento | Painel `/admin/configuracoes` (banco de dados — o único campo de identidade editável em runtime no MVP) |
| Serviços | Painel `/admin/servicos` (banco de dados) |
| Profissionais + horários de trabalho | Painel `/admin/profissionais` (banco de dados) |
| Depoimentos | Tabela `testimonials` (banco de dados, sem tela própria ainda) |

**Nunca** espalhe nome da empresa, telefone, cores, etc. diretamente em componentes/páginas — sempre consuma de `company-config.ts` (ou, para horários, de `lib/config/get-company-settings.ts`).

## 3. O que NÃO alterar (core do sistema)

Estes arquivos/padrões são compartilhados entre todos os clientes e não devem mudar por cliente:

- `lib/supabase/*` (client/server/admin/middleware)
- `lib/booking/*` (motor de disponibilidade — puro, testado)
- `proxy.ts` (RBAC de rotas)
- Políticas de RLS nas migrations (a menos que seja um hardening intencional)
- O fluxo de `(auth)` (login/cadastro)
- A estrutura de `services/*-repository.ts` e `lib/validations/*`

## 4. Papéis e permissões (RBAC)

Três papéis, em `profiles.role`: `admin`, `atendente`, `cliente`.

- **cliente**: padrão para todo novo cadastro. Vê apenas seus próprios agendamentos em `/minha-conta`.
- **atendente**: acessa `/admin` com navegação reduzida (Dashboard + Agenda). Não vê Serviços/Profissionais/Configurações.
- **admin**: acesso completo a `/admin`.

**Promoção de papel é manual e via service role** — não existe autopromoção pelo painel (simplificação de segurança deliberada do MVP). Para promover a primeira conta admin de um novo cliente, rode no SQL editor do Supabase (autenticado como service role, ou diretamente no SQL editor que já roda fora do contexto de RLS):

```sql
update profiles set role = 'admin' where id = '<uuid-do-usuário>';
```

O UUID é o `id` do usuário em Authentication → Users no painel do Supabase (crie a conta pelo `/cadastro` do site primeiro, depois promova).

## 5. Motor de agendamento — como funciona

`lib/booking/compute-available-slots.ts` é uma função pura (sem Supabase, sem Next) que recebe janelas de horário de trabalho, bloqueios (folgas + agendamentos existentes) e a duração do serviço, e devolve os horários disponíveis. `services/booking/availability-repository.ts` é a única camada que sabe falar com o Supabase — busca os dados, converte para o formato "minutos desde a meia-noite" (via `lib/booking/timezone.ts`) e chama a função pura.

Tanto o fluxo público (`/agendar`) quanto o agendamento manual do painel (`/admin/agenda`) chamam exatamente a mesma lógica — não existe duplicação entre os dois fluxos.

## 6. Testar antes de publicar

- [ ] Cadastro de cliente (`/cadastro`) e login (`/login`)
- [ ] Navegação pelo site público: início, serviços, sobre, contato
- [ ] Fluxo de agendamento público completo (`/agendar`): serviço → profissional → data/horário → confirmação
- [ ] Cliente vê o agendamento em `/minha-conta` e consegue cancelar
- [ ] Login como admin: dashboard mostra os agendamentos do dia
- [ ] Admin cria um agendamento manual em `/admin/agenda`
- [ ] Admin cadastra/edita um serviço e um profissional (com horário de trabalho)
- [ ] Admin edita o horário de funcionamento em `/admin/configuracoes` e ele reflete em `/contato`
- [ ] Conta `cliente` tentando acessar `/admin` é redirecionada
- [ ] Conta `atendente` vê apenas Dashboard + Agenda no painel

## 7. Limitações conhecidas do MVP (fase 1)

Documentadas aqui para não surpreender no meio de um projeto de cliente — todas com um caminho de evolução claro:

- **Cores/logo não são editáveis via painel** (`/admin/configuracoes/identidade` do escopo completo foi adiado) — hoje são arquivo/CSS, editados uma vez na duplicação. A convenção de tokens semânticos do Tailwind (`bg-primary`, nunca `bg-blue-600`) já deixa isso pronto para virar editável em runtime numa fase futura, sem tocar em componentes.
- **Sem tela de gestão de clientes** (`/admin/clientes`) — dá pra ver quem agendou o quê a partir de `appointments` + `profiles`, mas não há tela dedicada com notas/tags.
- **Sem relatórios.**
- **Sem agendamento como convidado** — confirmar um agendamento exige login.
- **Sem constraint de banco contra overlap** (`EXCLUDE USING gist`) — a proteção contra corrida é feita reconferindo a disponibilidade na server action, imediatamente antes do insert. Considerar adicionar a constraint antes de um cliente com volume real de agendamentos simultâneos.
- **`/atendente` reaproveita o layout do admin** com navegação filtrada por papel, em vez de uma árvore de rotas separada.
- **Depoimentos** não têm tela própria no painel — cadastre via SQL direto na tabela `testimonials`.
- **Sem notificações** (e-mail/SMS/WhatsApp) de lembrete de agendamento.

## 8. Solução de problemas

- **"Configurações não encontradas no banco de dados"** em `/admin/configuracoes`: as migrations não rodaram, ou rodaram fora de ordem. Rode `supabase/migrations/*.sql` em ordem — a segunda migration (`company_settings`) semeia a linha inicial.
- **RLS bloqueando tudo:** confirme que `SUPABASE_SERVICE_ROLE_KEY` está correta no `.env.local` e que sua conta foi promovida a `admin` (seção 4) antes de tentar usar o painel.
- **Login funciona mas `/admin` redireciona para `/`:** sua conta ainda está com `role = 'cliente'` — promova via SQL (seção 4).
