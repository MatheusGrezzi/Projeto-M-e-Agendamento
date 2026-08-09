-- Projeto-Mãe Agendamento — schema (3/5): services, professionals, working hours
--
-- These are the catalog tables the admin panel manages so nothing about a
-- specific client's offering is hardcoded in pages/components.

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  price_cents integer not null default 0,
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_active_order_idx on services (active, display_order);

drop trigger if exists services_set_updated_at on services;
create trigger services_set_updated_at
  before update on services
  for each row execute function set_updated_at();

create table if not exists professionals (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  bio text,
  photo_url text,
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists professionals_active_order_idx on professionals (active, display_order);

drop trigger if exists professionals_set_updated_at on professionals;
create trigger professionals_set_updated_at
  before update on professionals
  for each row execute function set_updated_at();

create table if not exists professional_services (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals (id) on delete cascade,
  service_id uuid not null references services (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (professional_id, service_id)
);

create index if not exists professional_services_professional_idx on professional_services (professional_id);
create index if not exists professional_services_service_idx on professional_services (service_id);

create table if not exists professional_working_hours (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals (id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists professional_working_hours_professional_idx
  on professional_working_hours (professional_id, weekday);

drop trigger if exists professional_working_hours_set_updated_at on professional_working_hours;
create trigger professional_working_hours_set_updated_at
  before update on professional_working_hours
  for each row execute function set_updated_at();

-- ============================================================
-- Row Level Security — same shape for all four tables: public read of
-- active/relevant rows (the public booking flow needs this to list options),
-- admin-only writes.
-- ============================================================
alter table services enable row level security;
alter table professionals enable row level security;
alter table professional_services enable row level security;
alter table professional_working_hours enable row level security;

drop policy if exists "services_select_active_or_staff" on services;
create policy "services_select_active_or_staff"
  on services for select
  to anon, authenticated
  using (active or auth_role() in ('admin', 'atendente'));

drop policy if exists "services_write_admin" on services;
create policy "services_write_admin"
  on services for all
  to authenticated
  using (auth_role() = 'admin')
  with check (auth_role() = 'admin');

drop policy if exists "professionals_select_active_or_staff" on professionals;
create policy "professionals_select_active_or_staff"
  on professionals for select
  to anon, authenticated
  using (active or auth_role() in ('admin', 'atendente'));

drop policy if exists "professionals_write_admin" on professionals;
create policy "professionals_write_admin"
  on professionals for all
  to authenticated
  using (auth_role() = 'admin')
  with check (auth_role() = 'admin');

drop policy if exists "professional_services_select_public" on professional_services;
create policy "professional_services_select_public"
  on professional_services for select
  to anon, authenticated
  using (true);

drop policy if exists "professional_services_write_admin" on professional_services;
create policy "professional_services_write_admin"
  on professional_services for all
  to authenticated
  using (auth_role() = 'admin')
  with check (auth_role() = 'admin');

drop policy if exists "professional_working_hours_select_public" on professional_working_hours;
create policy "professional_working_hours_select_public"
  on professional_working_hours for select
  to anon, authenticated
  using (true);

drop policy if exists "professional_working_hours_write_admin" on professional_working_hours;
create policy "professional_working_hours_write_admin"
  on professional_working_hours for all
  to authenticated
  using (auth_role() = 'admin')
  with check (auth_role() = 'admin');
