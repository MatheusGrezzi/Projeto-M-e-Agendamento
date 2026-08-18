-- Reconnect OS — initial schema (2/2): clients + catalogs + client sub-entities
--
-- Everything here hangs off `clients.organization_id` for tenancy. Lookup
-- catalogs (segments, equipment, services, brands) are global by default
-- (organization_id null, seeded below) but can also hold org-specific custom
-- entries (organization_id set) — e.g. "Permitir cadastrar equipamentos
-- personalizados" from the spec. `is_client_org_member()` is the one helper
-- every client-scoped child table's RLS policy relies on.

-- ============================================================
-- is_client_org_member(): security definer helper reused by every table
-- scoped through clients.id instead of organization_id directly.
-- ============================================================
create or replace function is_client_org_member(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from clients c
    join organization_members m on m.organization_id = c.organization_id
    where c.id = p_client_id and m.user_id = auth.uid()
  );
$$;

-- ============================================================
-- clients — the agency's clients (assistências técnicas)
-- ============================================================
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,

  name text not null,
  trade_name text,
  cnpj text,
  website text,
  whatsapp text,
  phone text,
  email text,
  business_hours text,
  notes text,

  status text not null default 'onboarding' check (status in ('onboarding', 'active', 'paused', 'churned')),
  primary_city text,
  primary_state text,

  daily_budget numeric(12, 2),
  monthly_budget_estimate numeric(12, 2),
  average_ticket numeric(12, 2),
  lead_goal integer,
  cpl_goal numeric(12, 2),
  closed_services_goal integer,
  cpa_goal numeric(12, 2),
  roas_goal numeric(6, 2),

  -- "sem restrição de marca" is the default: no client_brands rows at all.
  -- Flips to 'specific' once the client starts tagging brands as
  -- served/not_served (enforced in the app layer, not the DB).
  brand_policy text not null default 'no_restriction' check (brand_policy in ('no_restriction', 'specific')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_organization_id_idx on clients (organization_id);

drop trigger if exists clients_set_updated_at on clients;
create trigger clients_set_updated_at
  before update on clients
  for each row execute function set_updated_at();

-- ============================================================
-- segments — fixed catalog (Refrigeração doméstica / Ar-condicionado /
-- Eletrodomésticos / Outros). Global reference data, not org-scoped.
-- ============================================================
create table if not exists segments (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists client_segments (
  client_id uuid not null references clients (id) on delete cascade,
  segment_id uuid not null references segments (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (client_id, segment_id)
);

-- ============================================================
-- equipment — global catalog (organization_id null) + per-org custom items
-- ============================================================
create table if not exists equipment (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (id) on delete cascade,
  segment_id uuid not null references segments (id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists equipment_segment_id_idx on equipment (segment_id);

-- equipamentos atendidos
create table if not exists client_equipment (
  client_id uuid not null references clients (id) on delete cascade,
  equipment_id uuid not null references equipment (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (client_id, equipment_id)
);

-- equipamentos NÃO atendidos — equipment_id when it's a catalog item,
-- free-text label when it isn't (e.g. "Geladeira comercial").
create table if not exists client_excluded_equipment (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  equipment_id uuid references equipment (id) on delete set null,
  label text,
  notes text,
  created_at timestamptz not null default now(),
  constraint client_excluded_equipment_has_target check (equipment_id is not null or label is not null)
);

-- ============================================================
-- services — global catalog of service *types* (Conserto, Manutenção, ...)
-- + per-org custom items. A client's actual offering is the combination of
-- equipment + service (client_services below).
-- ============================================================
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- serviços realizados: combinação equipamento + serviço
create table if not exists client_services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  equipment_id uuid not null references equipment (id) on delete restrict,
  service_id uuid not null references services (id) on delete restrict,
  notes text,
  created_at timestamptz not null default now(),
  unique (client_id, equipment_id, service_id)
);

-- serviços NÃO realizados — pode ser um serviço genérico ("Venda de peças"),
-- uma combinação específica equipamento+serviço, ou um rótulo livre.
create table if not exists client_excluded_services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  equipment_id uuid references equipment (id) on delete set null,
  service_id uuid references services (id) on delete set null,
  label text,
  notes text,
  created_at timestamptz not null default now(),
  constraint client_excluded_services_has_target check (
    equipment_id is not null or service_id is not null or label is not null
  )
);

-- ============================================================
-- brands — global catalog + per-org custom items
-- ============================================================
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists client_brands (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  brand_id uuid not null references brands (id) on delete cascade,
  status text not null check (status in ('served', 'not_served')),
  created_at timestamptz not null default now(),
  unique (client_id, brand_id)
);

-- ============================================================
-- client_locations — regiões atendidas / não atendidas, com prioridade
-- ============================================================
create table if not exists client_locations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  city text not null,
  state text not null,
  neighborhood text,
  priority text check (priority in ('muito_alta', 'alta', 'media', 'baixa')),
  is_served boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- client_landing_pages
-- ============================================================
create table if not exists client_landing_pages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  name text not null,
  url text not null,
  segment_id uuid references segments (id) on delete set null,
  equipment_id uuid references equipment (id) on delete set null,
  service_id uuid references services (id) on delete set null,
  city text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- client_conversions
-- ============================================================
create table if not exists client_conversions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  name text not null,
  platform text,
  conversion_type text not null check (conversion_type in ('whatsapp', 'call', 'form', 'booking', 'purchase', 'other')),
  external_id text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- activity_logs — append-only audit trail
-- ============================================================
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid references profiles (id) on delete set null,
  client_id uuid references clients (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_logs_organization_id_idx on activity_logs (organization_id, created_at desc);
create index if not exists activity_logs_client_id_idx on activity_logs (client_id, created_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table clients enable row level security;
alter table segments enable row level security;
alter table client_segments enable row level security;
alter table equipment enable row level security;
alter table client_equipment enable row level security;
alter table client_excluded_equipment enable row level security;
alter table services enable row level security;
alter table client_services enable row level security;
alter table client_excluded_services enable row level security;
alter table brands enable row level security;
alter table client_brands enable row level security;
alter table client_locations enable row level security;
alter table client_landing_pages enable row level security;
alter table client_conversions enable row level security;
alter table activity_logs enable row level security;

-- clients: full CRUD for org members, delete reserved for owner/admin
drop policy if exists "clients_select_member" on clients;
create policy "clients_select_member" on clients for select to authenticated using (is_org_member(organization_id));

drop policy if exists "clients_insert_member" on clients;
create policy "clients_insert_member" on clients for insert to authenticated with check (is_org_member(organization_id));

drop policy if exists "clients_update_member" on clients;
create policy "clients_update_member" on clients for update to authenticated
  using (is_org_member(organization_id)) with check (is_org_member(organization_id));

drop policy if exists "clients_delete_admin" on clients;
create policy "clients_delete_admin" on clients for delete to authenticated using (is_org_admin(organization_id));

-- segments: read-only global reference data
drop policy if exists "segments_select_all" on segments;
create policy "segments_select_all" on segments for select to authenticated using (true);

-- equipment / services / brands: global rows (organization_id null) readable
-- by everyone; custom rows scoped to the owning org; writes only for the
-- owning org's own custom rows (never the global seed).
drop policy if exists "equipment_select_global_or_member" on equipment;
create policy "equipment_select_global_or_member" on equipment for select to authenticated
  using (organization_id is null or is_org_member(organization_id));
drop policy if exists "equipment_insert_member" on equipment;
create policy "equipment_insert_member" on equipment for insert to authenticated
  with check (organization_id is not null and is_org_member(organization_id));
drop policy if exists "equipment_update_member" on equipment;
create policy "equipment_update_member" on equipment for update to authenticated
  using (organization_id is not null and is_org_member(organization_id))
  with check (organization_id is not null and is_org_member(organization_id));
drop policy if exists "equipment_delete_member" on equipment;
create policy "equipment_delete_member" on equipment for delete to authenticated
  using (organization_id is not null and is_org_member(organization_id));

drop policy if exists "services_select_global_or_member" on services;
create policy "services_select_global_or_member" on services for select to authenticated
  using (organization_id is null or is_org_member(organization_id));
drop policy if exists "services_insert_member" on services;
create policy "services_insert_member" on services for insert to authenticated
  with check (organization_id is not null and is_org_member(organization_id));
drop policy if exists "services_update_member" on services;
create policy "services_update_member" on services for update to authenticated
  using (organization_id is not null and is_org_member(organization_id))
  with check (organization_id is not null and is_org_member(organization_id));
drop policy if exists "services_delete_member" on services;
create policy "services_delete_member" on services for delete to authenticated
  using (organization_id is not null and is_org_member(organization_id));

drop policy if exists "brands_select_global_or_member" on brands;
create policy "brands_select_global_or_member" on brands for select to authenticated
  using (organization_id is null or is_org_member(organization_id));
drop policy if exists "brands_insert_member" on brands;
create policy "brands_insert_member" on brands for insert to authenticated
  with check (organization_id is not null and is_org_member(organization_id));
drop policy if exists "brands_update_member" on brands;
create policy "brands_update_member" on brands for update to authenticated
  using (organization_id is not null and is_org_member(organization_id))
  with check (organization_id is not null and is_org_member(organization_id));
drop policy if exists "brands_delete_member" on brands;
create policy "brands_delete_member" on brands for delete to authenticated
  using (organization_id is not null and is_org_member(organization_id));

-- client-scoped child tables: same four-policy shape, all gated through
-- is_client_org_member(client_id)
drop policy if exists "client_segments_all_member" on client_segments;
create policy "client_segments_all_member" on client_segments for all to authenticated
  using (is_client_org_member(client_id)) with check (is_client_org_member(client_id));

drop policy if exists "client_equipment_all_member" on client_equipment;
create policy "client_equipment_all_member" on client_equipment for all to authenticated
  using (is_client_org_member(client_id)) with check (is_client_org_member(client_id));

drop policy if exists "client_excluded_equipment_all_member" on client_excluded_equipment;
create policy "client_excluded_equipment_all_member" on client_excluded_equipment for all to authenticated
  using (is_client_org_member(client_id)) with check (is_client_org_member(client_id));

drop policy if exists "client_services_all_member" on client_services;
create policy "client_services_all_member" on client_services for all to authenticated
  using (is_client_org_member(client_id)) with check (is_client_org_member(client_id));

drop policy if exists "client_excluded_services_all_member" on client_excluded_services;
create policy "client_excluded_services_all_member" on client_excluded_services for all to authenticated
  using (is_client_org_member(client_id)) with check (is_client_org_member(client_id));

drop policy if exists "client_brands_all_member" on client_brands;
create policy "client_brands_all_member" on client_brands for all to authenticated
  using (is_client_org_member(client_id)) with check (is_client_org_member(client_id));

drop policy if exists "client_locations_all_member" on client_locations;
create policy "client_locations_all_member" on client_locations for all to authenticated
  using (is_client_org_member(client_id)) with check (is_client_org_member(client_id));

drop policy if exists "client_landing_pages_all_member" on client_landing_pages;
create policy "client_landing_pages_all_member" on client_landing_pages for all to authenticated
  using (is_client_org_member(client_id)) with check (is_client_org_member(client_id));

drop policy if exists "client_conversions_all_member" on client_conversions;
create policy "client_conversions_all_member" on client_conversions for all to authenticated
  using (is_client_org_member(client_id)) with check (is_client_org_member(client_id));

-- activity_logs: append-only — select + insert, no update/delete policy
drop policy if exists "activity_logs_select_member" on activity_logs;
create policy "activity_logs_select_member" on activity_logs for select to authenticated
  using (is_org_member(organization_id));
drop policy if exists "activity_logs_insert_member" on activity_logs;
create policy "activity_logs_insert_member" on activity_logs for insert to authenticated
  with check (is_org_member(organization_id));

-- ============================================================
-- Seed data — global catalogs
-- ============================================================
insert into segments (key, label) values
  ('refrigeracao_domestica', 'Refrigeração doméstica'),
  ('ar_condicionado', 'Ar-condicionado'),
  ('eletrodomesticos', 'Eletrodomésticos'),
  ('outros', 'Outros')
on conflict (key) do nothing;

insert into equipment (segment_id, name)
select s.id, e.name
from segments s
join (values
  ('refrigeracao_domestica', 'Geladeira'),
  ('refrigeracao_domestica', 'Geladeira Frost Free'),
  ('refrigeracao_domestica', 'Side by Side'),
  ('refrigeracao_domestica', 'Freezer'),
  ('refrigeracao_domestica', 'Adega'),
  ('refrigeracao_domestica', 'Cervejeira'),
  ('refrigeracao_domestica', 'Bebedouro'),
  ('refrigeracao_domestica', 'Purificador'),
  ('ar_condicionado', 'Split'),
  ('ar_condicionado', 'Inverter'),
  ('ar_condicionado', 'Multi Split'),
  ('ar_condicionado', 'Ar-condicionado de janela'),
  ('ar_condicionado', 'Outros'),
  ('eletrodomesticos', 'Micro-ondas'),
  ('eletrodomesticos', 'Forno elétrico'),
  ('eletrodomesticos', 'Forno de embutir'),
  ('eletrodomesticos', 'Cooktop'),
  ('eletrodomesticos', 'Fogão'),
  ('eletrodomesticos', 'Máquina de lavar'),
  ('eletrodomesticos', 'Lava e seca'),
  ('eletrodomesticos', 'Secadora'),
  ('eletrodomesticos', 'Lava-louças'),
  ('eletrodomesticos', 'Outros')
) as e(segment_key, name) on e.segment_key = s.key
where not exists (
  select 1 from equipment ex
  where ex.organization_id is null and ex.segment_id = s.id and ex.name = e.name
);

insert into services (name)
select v.name
from (values
  ('Conserto'), ('Manutenção'), ('Manutenção corretiva'), ('Manutenção preventiva'),
  ('Diagnóstico'), ('Instalação'), ('Limpeza'), ('Higienização'), ('Outro')
) as v(name)
where not exists (select 1 from services ex where ex.organization_id is null and ex.name = v.name);

insert into brands (name)
select v.name
from (values
  ('Brastemp'), ('Consul'), ('Electrolux'), ('Samsung'), ('LG'), ('Panasonic'),
  ('Philco'), ('Midea'), ('TCL'), ('Carrier'), ('Daikin'), ('Fujitsu'), ('Gree')
) as v(name)
where not exists (select 1 from brands ex where ex.organization_id is null and ex.name = v.name);
