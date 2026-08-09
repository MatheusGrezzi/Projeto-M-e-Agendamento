-- Projeto-Mãe Agendamento — schema (4/5): time off + appointments
--
-- appointments is the transactional heart of the app. No DB-level overlap
-- exclusion constraint in MVP (would need the btree_gist extension) — the
-- booking server action re-checks availability immediately before insert as
-- the race-condition guard instead. Flagged in CUSTOMIZATION.md as a
-- hardening item before real production volume.

create table if not exists professional_time_off (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references professionals (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists professional_time_off_professional_idx
  on professional_time_off (professional_id, starts_at);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  professional_id uuid not null references professionals (id) on delete restrict,
  service_id uuid not null references services (id) on delete restrict,
  starts_at timestamptz not null,
  -- Denormalized from service.duration_minutes at booking time, so a later
  -- change to a service's duration never retroactively shifts a booked
  -- appointment's end time.
  ends_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed', 'no_show')),
  notes text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists appointments_professional_time_idx
  on appointments (professional_id, starts_at)
  where status = 'confirmed';
create index if not exists appointments_client_idx on appointments (client_id, starts_at desc);

drop trigger if exists appointments_set_updated_at on appointments;
create trigger appointments_set_updated_at
  before update on appointments
  for each row execute function set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table professional_time_off enable row level security;
alter table appointments enable row level security;

drop policy if exists "professional_time_off_select_public" on professional_time_off;
create policy "professional_time_off_select_public"
  on professional_time_off for select
  to anon, authenticated
  using (true);

drop policy if exists "professional_time_off_write_admin" on professional_time_off;
create policy "professional_time_off_write_admin"
  on professional_time_off for all
  to authenticated
  using (auth_role() = 'admin')
  with check (auth_role() = 'admin');

-- appointments: owner (the client who booked it) can read/insert/update
-- their own rows; staff (admin/atendente) can read/write everything. There
-- is no delete policy — cancellation is a status update, not a row delete.
drop policy if exists "appointments_select_own_or_staff" on appointments;
create policy "appointments_select_own_or_staff"
  on appointments for select
  to authenticated
  using (client_id = auth.uid() or auth_role() in ('admin', 'atendente'));

drop policy if exists "appointments_insert_own_or_staff" on appointments;
create policy "appointments_insert_own_or_staff"
  on appointments for insert
  to authenticated
  with check (client_id = auth.uid() or auth_role() in ('admin', 'atendente'));

drop policy if exists "appointments_update_own_or_staff" on appointments;
create policy "appointments_update_own_or_staff"
  on appointments for update
  to authenticated
  using (client_id = auth.uid() or auth_role() in ('admin', 'atendente'))
  with check (client_id = auth.uid() or auth_role() in ('admin', 'atendente'));
