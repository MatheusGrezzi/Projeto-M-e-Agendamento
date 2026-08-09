-- Projeto-Mãe Agendamento — clinic module: clinical client fields + prontuário
--
-- Adds fields relevant to clinics (odontológica/estética) without touching
-- the generic booking core — barbershops/salons simply never populate them.
-- `client_records` is a running clinical history log (prontuário), separate
-- from `appointments.notes` (which is per-visit) because a patient's
-- history needs to persist and accumulate across many appointments.

alter table profiles
  add column if not exists cpf text,
  add column if not exists health_insurance text,
  add column if not exists allergies_notes text;

create table if not exists client_records (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists client_records_client_idx on client_records (client_id, created_at desc);

alter table client_records enable row level security;

-- Staff-only: a clinical record log is not something a patient reads
-- directly through the app (matches how most clinics handle prontuário
-- access — through the professional, not a self-service portal).
drop policy if exists "client_records_staff_only" on client_records;
create policy "client_records_staff_only"
  on client_records for all
  to authenticated
  using (auth_role() in ('admin', 'atendente'))
  with check (auth_role() in ('admin', 'atendente'));
