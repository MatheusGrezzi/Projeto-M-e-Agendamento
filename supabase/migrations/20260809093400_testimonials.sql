-- Projeto-Mãe Agendamento — schema (5/5): testimonials

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  content text not null,
  rating integer check (rating between 1 and 5),
  featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists testimonials_order_idx on testimonials (display_order);

drop trigger if exists testimonials_set_updated_at on testimonials;
create trigger testimonials_set_updated_at
  before update on testimonials
  for each row execute function set_updated_at();

alter table testimonials enable row level security;

drop policy if exists "testimonials_select_public" on testimonials;
create policy "testimonials_select_public"
  on testimonials for select
  to anon, authenticated
  using (true);

drop policy if exists "testimonials_write_admin" on testimonials;
create policy "testimonials_write_admin"
  on testimonials for all
  to authenticated
  using (auth_role() = 'admin')
  with check (auth_role() = 'admin');
