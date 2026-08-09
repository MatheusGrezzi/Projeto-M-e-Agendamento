-- Projeto-Mãe Agendamento — schema (2/5): company_settings
--
-- MVP keeps almost all identity/branding in lib/config/company-config.ts
-- (file-based, edited once per client duplication). The one exception is
-- business hours: a shop owner plausibly needs to change these without a
-- redeploy, so they're the single DB-backed, admin-editable field here. See
-- lib/config/get-company-settings.ts for how this merges with the config
-- file's businessHoursFallback.

create table if not exists company_settings (
  id uuid primary key default gen_random_uuid(),
  business_hours jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists company_settings_set_updated_at on company_settings;
create trigger company_settings_set_updated_at
  before update on company_settings
  for each row execute function set_updated_at();

-- Single-row table: seed it now so the app always has a row to read/update.
insert into company_settings (business_hours)
select '[
  {"weekday": 0, "open": null, "close": null},
  {"weekday": 1, "open": "09:00", "close": "18:00"},
  {"weekday": 2, "open": "09:00", "close": "18:00"},
  {"weekday": 3, "open": "09:00", "close": "18:00"},
  {"weekday": 4, "open": "09:00", "close": "18:00"},
  {"weekday": 5, "open": "09:00", "close": "18:00"},
  {"weekday": 6, "open": "09:00", "close": "13:00"}
]'::jsonb
where not exists (select 1 from company_settings);

alter table company_settings enable row level security;

-- Public read: the site render (server-rendered, no per-tenant lookup) needs
-- this for anonymous visitors too.
drop policy if exists "company_settings_select_public" on company_settings;
create policy "company_settings_select_public"
  on company_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "company_settings_update_admin" on company_settings;
create policy "company_settings_update_admin"
  on company_settings for update
  to authenticated
  using (auth_role() = 'admin')
  with check (auth_role() = 'admin');
