-- Reconnect OS — Fase 2: campanhas + versionamento de estratégia
--
-- A campanha em si (`campaigns`) guarda o briefing (passo 1-8 do wizard).
-- Cada geração de estratégia cria uma nova `campaign_versions` (snapshot
-- imutável do JSON retornado pelo Estrategista) e é "explodida" nas tabelas
-- relacionais abaixo para exibição/consulta estruturada. `status` já cobre
-- todo o fluxo de vida da campanha (seção 32 do briefing) para não exigir
-- alter table nas próximas fases — Fase 2 só alcança 'draft' e
-- 'strategy_generated'; auditoria/aprovação/execução chegam depois.

-- ============================================================
-- is_campaign_org_member() / is_campaign_version_org_member() /
-- is_ad_group_org_member(): security definer helpers, mesmo padrão de
-- is_client_org_member() — cada um resolve o multi-hop até
-- organization_members para uso nas policies das tabelas abaixo.
-- ============================================================

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,

  name text not null,
  segment_id uuid not null references segments (id) on delete restrict,
  objective text not null check (objective in ('leads', 'whatsapp', 'calls', 'forms', 'bookings')),
  daily_budget numeric(12, 2) not null,
  notes text,

  status text not null default 'draft' check (status in (
    'draft', 'strategy_generated', 'under_audit', 'rejected', 'approved',
    'awaiting_human_approval', 'approved_for_execution', 'executed',
    'qa_review', 'active', 'optimization'
  )),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_client_id_idx on campaigns (client_id);

drop trigger if exists campaigns_set_updated_at on campaigns;
create trigger campaigns_set_updated_at
  before update on campaigns
  for each row execute function set_updated_at();

create or replace function is_campaign_org_member(p_campaign_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from campaigns c
    join clients cl on cl.id = c.client_id
    join organization_members m on m.organization_id = cl.organization_id
    where c.id = p_campaign_id and m.user_id = auth.uid()
  );
$$;

-- briefing: passos 3-5 do wizard (equipamento / serviços / regiões),
-- sempre referenciando o que o cliente de fato atende.
create table if not exists campaign_equipment (
  campaign_id uuid not null references campaigns (id) on delete cascade,
  equipment_id uuid not null references equipment (id) on delete restrict,
  primary key (campaign_id, equipment_id)
);

create table if not exists campaign_services (
  campaign_id uuid not null references campaigns (id) on delete cascade,
  client_service_id uuid not null references client_services (id) on delete restrict,
  primary key (campaign_id, client_service_id)
);

create table if not exists campaign_locations (
  campaign_id uuid not null references campaigns (id) on delete cascade,
  client_location_id uuid not null references client_locations (id) on delete restrict,
  primary key (campaign_id, client_location_id)
);

-- ============================================================
-- campaign_versions — snapshot imutável de cada geração do Estrategista
-- ============================================================
create table if not exists campaign_versions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  version_number integer not null,
  strategy_json jsonb not null,
  warnings jsonb not null default '[]'::jsonb,
  reasoning_summary text,
  generated_by text not null default 'placeholder_engine',
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (campaign_id, version_number)
);

create index if not exists campaign_versions_campaign_id_idx on campaign_versions (campaign_id, version_number desc);

create or replace function is_campaign_version_org_member(p_version_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from campaign_versions v
    join campaigns c on c.id = v.campaign_id
    join clients cl on cl.id = c.client_id
    join organization_members m on m.organization_id = cl.organization_id
    where v.id = p_version_id and m.user_id = auth.uid()
  );
$$;

-- ============================================================
-- campaign_ad_groups / campaign_keywords — explosão relacional de
-- strategy_json.ad_groups[] para exibição e consulta estruturada
-- ============================================================
create table if not exists campaign_ad_groups (
  id uuid primary key default gen_random_uuid(),
  campaign_version_id uuid not null references campaign_versions (id) on delete cascade,
  name text not null,
  equipment_id uuid references equipment (id) on delete set null,
  service_id uuid references services (id) on delete set null,
  landing_page_id uuid references client_landing_pages (id) on delete set null,
  headlines jsonb not null default '[]'::jsonb,
  descriptions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists campaign_ad_groups_version_id_idx on campaign_ad_groups (campaign_version_id);

create or replace function is_ad_group_org_member(p_ad_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from campaign_ad_groups g
    join campaign_versions v on v.id = g.campaign_version_id
    join campaigns c on c.id = v.campaign_id
    join clients cl on cl.id = c.client_id
    join organization_members m on m.organization_id = cl.organization_id
    where g.id = p_ad_group_id and m.user_id = auth.uid()
  );
$$;

create table if not exists campaign_keywords (
  id uuid primary key default gen_random_uuid(),
  ad_group_id uuid not null references campaign_ad_groups (id) on delete cascade,
  keyword text not null,
  match_type text not null check (match_type in ('broad', 'phrase', 'exact')),
  created_at timestamptz not null default now()
);

create index if not exists campaign_keywords_ad_group_id_idx on campaign_keywords (ad_group_id);

-- ============================================================
-- campaign_negatives — palavras negativas a nível de campanha
-- (strategy_json.campaign_negatives[])
-- ============================================================
create table if not exists campaign_negatives (
  id uuid primary key default gen_random_uuid(),
  campaign_version_id uuid not null references campaign_versions (id) on delete cascade,
  keyword text not null,
  match_type text not null check (match_type in ('broad', 'phrase', 'exact')),
  created_at timestamptz not null default now()
);

create index if not exists campaign_negatives_version_id_idx on campaign_negatives (campaign_version_id);

-- ============================================================
-- campaign_assets — extensões/ativos do anúncio (strategy_json.assets[])
-- ============================================================
create table if not exists campaign_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_version_id uuid not null references campaign_versions (id) on delete cascade,
  asset_type text not null default 'sitelink',
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists campaign_assets_version_id_idx on campaign_assets (campaign_version_id);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table campaigns enable row level security;
alter table campaign_equipment enable row level security;
alter table campaign_services enable row level security;
alter table campaign_locations enable row level security;
alter table campaign_versions enable row level security;
alter table campaign_ad_groups enable row level security;
alter table campaign_keywords enable row level security;
alter table campaign_negatives enable row level security;
alter table campaign_assets enable row level security;

drop policy if exists "campaigns_all_member" on campaigns;
create policy "campaigns_all_member" on campaigns for all to authenticated
  using (is_client_org_member(client_id)) with check (is_client_org_member(client_id));

drop policy if exists "campaign_equipment_all_member" on campaign_equipment;
create policy "campaign_equipment_all_member" on campaign_equipment for all to authenticated
  using (is_campaign_org_member(campaign_id)) with check (is_campaign_org_member(campaign_id));

drop policy if exists "campaign_services_all_member" on campaign_services;
create policy "campaign_services_all_member" on campaign_services for all to authenticated
  using (is_campaign_org_member(campaign_id)) with check (is_campaign_org_member(campaign_id));

drop policy if exists "campaign_locations_all_member" on campaign_locations;
create policy "campaign_locations_all_member" on campaign_locations for all to authenticated
  using (is_campaign_org_member(campaign_id)) with check (is_campaign_org_member(campaign_id));

-- campaign_versions: append-only snapshots — select + insert, no update/delete
drop policy if exists "campaign_versions_select_member" on campaign_versions;
create policy "campaign_versions_select_member" on campaign_versions for select to authenticated
  using (is_campaign_org_member(campaign_id));
drop policy if exists "campaign_versions_insert_member" on campaign_versions;
create policy "campaign_versions_insert_member" on campaign_versions for insert to authenticated
  with check (is_campaign_org_member(campaign_id));

drop policy if exists "campaign_ad_groups_select_member" on campaign_ad_groups;
create policy "campaign_ad_groups_select_member" on campaign_ad_groups for select to authenticated
  using (is_campaign_version_org_member(campaign_version_id));
drop policy if exists "campaign_ad_groups_insert_member" on campaign_ad_groups;
create policy "campaign_ad_groups_insert_member" on campaign_ad_groups for insert to authenticated
  with check (is_campaign_version_org_member(campaign_version_id));

drop policy if exists "campaign_keywords_select_member" on campaign_keywords;
create policy "campaign_keywords_select_member" on campaign_keywords for select to authenticated
  using (is_ad_group_org_member(ad_group_id));
drop policy if exists "campaign_keywords_insert_member" on campaign_keywords;
create policy "campaign_keywords_insert_member" on campaign_keywords for insert to authenticated
  with check (is_ad_group_org_member(ad_group_id));

drop policy if exists "campaign_negatives_select_member" on campaign_negatives;
create policy "campaign_negatives_select_member" on campaign_negatives for select to authenticated
  using (is_campaign_version_org_member(campaign_version_id));
drop policy if exists "campaign_negatives_insert_member" on campaign_negatives;
create policy "campaign_negatives_insert_member" on campaign_negatives for insert to authenticated
  with check (is_campaign_version_org_member(campaign_version_id));

drop policy if exists "campaign_assets_select_member" on campaign_assets;
create policy "campaign_assets_select_member" on campaign_assets for select to authenticated
  using (is_campaign_version_org_member(campaign_version_id));
drop policy if exists "campaign_assets_insert_member" on campaign_assets;
create policy "campaign_assets_insert_member" on campaign_assets for insert to authenticated
  with check (is_campaign_version_org_member(campaign_version_id));
