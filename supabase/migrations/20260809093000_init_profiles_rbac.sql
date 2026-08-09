-- Projeto-Mãe Agendamento — initial schema (1/5): profiles + RBAC
--
-- Every other migration's RLS policies depend on the auth_role() helper
-- defined here. Roles: admin (full access), atendente (staff, narrower
-- write access), cliente (customer, own data only). A profile row is
-- auto-created for every new auth.users row via handle_new_user(); role
-- promotion is a manual, service-role-only operation (see CUSTOMIZATION.md)
-- — there is no self-serve "become admin" path in this template.

create extension if not exists "pgcrypto";

-- ============================================================
-- shared updated_at trigger function (reused by every later migration)
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- profiles
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'cliente' check (role in ('admin', 'atendente', 'cliente')),
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ============================================================
-- auth_role(): security definer so it can be called from inside another
-- table's RLS policy without recursing into profiles' own RLS (the function
-- runs with its owner's privileges, which bypasses RLS on the inner select).
-- ============================================================
create or replace function auth_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

-- ============================================================
-- handle_new_user(): auto-creates a `cliente` profile row on signup.
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- prevent_role_self_escalation(): RLS can't express column-level write
-- restrictions, so a user's own UPDATE policy on profiles must allow the row
-- but a trigger blocks the `role` column specifically from changing except
-- when performed with no JWT context (service role / direct SQL — e.g. the
-- manual "promote to admin" step in CUSTOMIZATION.md, or the Supabase SQL
-- editor, both of which see auth.uid() = null).
-- ============================================================
create or replace function prevent_role_self_escalation()
returns trigger as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Alterar o campo role requer a service role.';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists profiles_prevent_role_self_escalation on profiles;
create trigger profiles_prevent_role_self_escalation
  before update on profiles
  for each row execute function prevent_role_self_escalation();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;

drop policy if exists "profiles_select_own_or_staff" on profiles;
create policy "profiles_select_own_or_staff"
  on profiles for select
  to authenticated
  using (auth.uid() = id or auth_role() in ('admin', 'atendente'));

drop policy if exists "profiles_update_own_or_admin" on profiles;
create policy "profiles_update_own_or_admin"
  on profiles for update
  to authenticated
  using (auth.uid() = id or auth_role() = 'admin')
  with check (auth.uid() = id or auth_role() = 'admin');
