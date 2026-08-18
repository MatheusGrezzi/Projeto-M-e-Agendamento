-- Reconnect OS — initial schema (1/2): organizations + profiles + membership
--
-- Multi-tenant from day one even though only one real organization exists
-- today (the Reconnect agency itself). Every later table hangs off
-- `clients.organization_id`, and access is gated by `organization_members`.
-- A profile row is auto-created for every new auth.users row via
-- handle_new_user(), which also joins the user to the oldest organization
-- (today: the single seeded "Reconnect" org) — the first member ever becomes
-- its owner, everyone after joins as a plain member. Role changes beyond
-- that bootstrap are a manual, service-role-only operation.

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
-- organizations
-- ============================================================
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- profiles
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ============================================================
-- organization_members
-- ============================================================
create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- ============================================================
-- is_org_member() / is_org_admin(): security definer so they can be called
-- from inside another table's RLS policy without recursing into
-- organization_members' own RLS.
-- ============================================================
create or replace function is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from organization_members
    where organization_id = org_id and user_id = auth.uid()
  );
$$;

create or replace function is_org_admin(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from organization_members
    where organization_id = org_id and user_id = auth.uid() and role in ('owner', 'admin')
  );
$$;

-- ============================================================
-- handle_new_user(): auto-creates a profile row and joins the new user to
-- the oldest organization on signup (bootstrap for the single-tenant V1
-- reality — see header note). No-op if no organization exists yet.
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
declare
  target_org_id uuid;
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data ->> 'name', new.email)
  on conflict (id) do nothing;

  select id into target_org_id from public.organizations order by created_at asc limit 1;

  if target_org_id is not null then
    insert into public.organization_members (organization_id, user_id, role)
    values (
      target_org_id,
      new.id,
      case
        when exists (select 1 from public.organization_members where organization_id = target_org_id)
        then 'member'
        else 'owner'
      end
    )
    on conflict (organization_id, user_id) do nothing;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table organization_members enable row level security;

drop policy if exists "organizations_select_member" on organizations;
create policy "organizations_select_member"
  on organizations for select
  to authenticated
  using (is_org_member(id));

drop policy if exists "profiles_select_self_or_org_peer" on profiles;
create policy "profiles_select_self_or_org_peer"
  on profiles for select
  to authenticated
  using (
    auth.uid() = id
    or exists (
      select 1
      from organization_members mine
      join organization_members theirs on theirs.organization_id = mine.organization_id
      where mine.user_id = auth.uid() and theirs.user_id = profiles.id
    )
  );

drop policy if exists "profiles_update_self" on profiles;
create policy "profiles_update_self"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "organization_members_select_peer" on organization_members;
create policy "organization_members_select_peer"
  on organization_members for select
  to authenticated
  using (is_org_member(organization_id));

-- ============================================================
-- Seed: the agency's own organization. V1 is effectively single-tenant —
-- every new signup auto-joins whichever organization was created first.
-- ============================================================
insert into organizations (name)
select 'Reconnect'
where not exists (select 1 from organizations);
