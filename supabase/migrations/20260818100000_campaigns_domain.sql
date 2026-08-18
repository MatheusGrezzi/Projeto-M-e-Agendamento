-- Reconnect OS — Fase 2: campanhas + Agente Estrategista + schema padronizado
--
-- `campaigns` carries `organization_id` directly (denormalized from
-- clients.organization_id at creation time) so its RLS reuses the plain
-- is_org_member() helper from Fase 1 instead of a join through clients.
-- Everything hanging off a campaign (versions, ad groups, ads, keywords,
-- negatives, assets, briefing join tables) is scoped through
-- is_campaign_org_member(campaign_id) below.
--
-- `campaign_versions` is an append-only, immutable snapshot of exactly what
-- the Estrategista (or a human regenerating it) produced — the JSON blob is
-- the audit trail; campaign_ad_groups/campaign_ads/campaign_keywords/
-- campaign_negatives explode it for structured display and future querying.
-- `status` already covers the full campaign lifecycle (see briefing seção
-- 32) so no alter table is needed in later fases — Fase 2 only reaches
-- 'draft' and 'strategy_generated'.

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  created_by uuid references profiles (id) on delete set null,

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

create index if not exists campaigns_organization_id_idx on campaigns (organization_id);
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
    join organization_members m on m.organization_id = c.organization_id
    where c.id = p_campaign_id and m.user_id = auth.uid()
  );
$$;

-- briefing imutável (passos 1-9 do wizard): sempre referenciando o que o
-- cliente de fato tem cadastrado — nunca um valor livre.
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

create table if not exists campaign_conversions (
  campaign_id uuid not null references campaigns (id) on delete cascade,
  client_conversion_id uuid not null references client_conversions (id) on delete restrict,
  primary key (campaign_id, client_conversion_id)
);

create table if not exists campaign_landing_pages (
  campaign_id uuid not null references campaigns (id) on delete cascade,
  client_landing_page_id uuid not null references client_landing_pages (id) on delete restrict,
  primary key (campaign_id, client_landing_page_id)
);

-- ============================================================
-- campaign_versions — snapshot imutável de cada geração/regeneração do
-- Estrategista. generator_type distingue 'ai' de 'deterministic' (motor
-- placeholder); generated_by grava o identificador do provider/modelo.
-- generation_reason grava o "por que regenerar" opcional (seção 15).
-- ============================================================
create table if not exists campaign_versions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  version_number integer not null,
  strategy_json jsonb not null,
  generator_type text not null check (generator_type in ('ai', 'deterministic')),
  generated_by text not null,
  generation_reason text,
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
    join organization_members m on m.organization_id = c.organization_id
    where v.id = p_version_id and m.user_id = auth.uid()
  );
$$;

-- ============================================================
-- campaign_ad_groups / campaign_ads / campaign_keywords — explosão
-- relacional de strategy_json.ad_groups[] para exibição e consulta
-- estruturada. Um grupo pode ter mais de um anúncio RSA.
-- ============================================================
create table if not exists campaign_ad_groups (
  id uuid primary key default gen_random_uuid(),
  campaign_version_id uuid not null references campaign_versions (id) on delete cascade,
  name text not null,
  theme text,
  equipment_id uuid references equipment (id) on delete set null,
  service_id uuid references services (id) on delete set null,
  landing_page_id uuid references client_landing_pages (id) on delete set null,
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
    join organization_members m on m.organization_id = c.organization_id
    where g.id = p_ad_group_id and m.user_id = auth.uid()
  );
$$;

create table if not exists campaign_ads (
  id uuid primary key default gen_random_uuid(),
  ad_group_id uuid not null references campaign_ad_groups (id) on delete cascade,
  headlines jsonb not null default '[]'::jsonb,
  descriptions jsonb not null default '[]'::jsonb,
  path1 text,
  path2 text,
  created_at timestamptz not null default now()
);

create index if not exists campaign_ads_ad_group_id_idx on campaign_ads (ad_group_id);

-- match_type: apenas exact/phrase para palavras-chave POSITIVAS — a
-- Fase 2 não permite correspondência ampla por padrão (ver briefing § 8).
create table if not exists campaign_keywords (
  id uuid primary key default gen_random_uuid(),
  ad_group_id uuid not null references campaign_ad_groups (id) on delete cascade,
  text text not null,
  match_type text not null check (match_type in ('exact', 'phrase')),
  intent text,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists campaign_keywords_ad_group_id_idx on campaign_keywords (ad_group_id);

-- ============================================================
-- campaign_negatives — sempre específicas do cliente + contexto
-- (strategy_json.campaign_negatives[]), nunca uma lista universal.
-- ============================================================
create table if not exists campaign_negatives (
  id uuid primary key default gen_random_uuid(),
  campaign_version_id uuid not null references campaign_versions (id) on delete cascade,
  text text not null,
  match_type text not null check (match_type in ('exact', 'phrase', 'broad')),
  category text not null check (category in (
    'parts', 'diy', 'employment', 'training', 'manuals',
    'irrelevant_equipment', 'excluded_service', 'excluded_location', 'other'
  )),
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists campaign_negatives_version_id_idx on campaign_negatives (campaign_version_id);

-- ============================================================
-- campaign_assets — sitelinks / callouts / structured snippets
-- (strategy_json.assets)
-- ============================================================
create table if not exists campaign_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_version_id uuid not null references campaign_versions (id) on delete cascade,
  asset_type text not null check (asset_type in ('sitelink', 'callout', 'structured_snippet')),
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
alter table campaign_conversions enable row level security;
alter table campaign_landing_pages enable row level security;
alter table campaign_versions enable row level security;
alter table campaign_ad_groups enable row level security;
alter table campaign_ads enable row level security;
alter table campaign_keywords enable row level security;
alter table campaign_negatives enable row level security;
alter table campaign_assets enable row level security;

drop policy if exists "campaigns_all_member" on campaigns;
create policy "campaigns_all_member" on campaigns for all to authenticated
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

drop policy if exists "campaign_equipment_all_member" on campaign_equipment;
create policy "campaign_equipment_all_member" on campaign_equipment for all to authenticated
  using (is_campaign_org_member(campaign_id)) with check (is_campaign_org_member(campaign_id));

drop policy if exists "campaign_services_all_member" on campaign_services;
create policy "campaign_services_all_member" on campaign_services for all to authenticated
  using (is_campaign_org_member(campaign_id)) with check (is_campaign_org_member(campaign_id));

drop policy if exists "campaign_locations_all_member" on campaign_locations;
create policy "campaign_locations_all_member" on campaign_locations for all to authenticated
  using (is_campaign_org_member(campaign_id)) with check (is_campaign_org_member(campaign_id));

drop policy if exists "campaign_conversions_all_member" on campaign_conversions;
create policy "campaign_conversions_all_member" on campaign_conversions for all to authenticated
  using (is_campaign_org_member(campaign_id)) with check (is_campaign_org_member(campaign_id));

drop policy if exists "campaign_landing_pages_all_member" on campaign_landing_pages;
create policy "campaign_landing_pages_all_member" on campaign_landing_pages for all to authenticated
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

drop policy if exists "campaign_ads_select_member" on campaign_ads;
create policy "campaign_ads_select_member" on campaign_ads for select to authenticated
  using (is_ad_group_org_member(ad_group_id));
drop policy if exists "campaign_ads_insert_member" on campaign_ads;
create policy "campaign_ads_insert_member" on campaign_ads for insert to authenticated
  with check (is_ad_group_org_member(ad_group_id));

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
