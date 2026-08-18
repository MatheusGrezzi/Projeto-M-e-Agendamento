-- Reconnect OS — Fase 2 metadata + Fase 3: Agente Auditor
--
-- Part 1: adds generation-audit-trail columns to campaign_versions
-- (prompt_version/input_tokens/output_tokens/duration_ms) that the rewritten
-- AIProvider/AnthropicProvider now return alongside the raw strategy —
-- needed to prove which prompt/model produced a version and at what cost.
--
-- Part 2: campaign_audits (Agente 02 — Auditor) + campaign_approvals. The
-- Auditor is independent from the Estrategista: it only ever reads a
-- CampaignStrategy that already exists, never writes one. Every new
-- campaign_versions row needs its own audit — nothing here treats an audit
-- of an older version as valid for a newer one (enforced in the app layer:
-- campaign_approvals.campaign_audit_id must point at an audit of the
-- campaign's CURRENT latest version).

alter table campaign_versions add column if not exists prompt_version text not null default 'unknown';
alter table campaign_versions add column if not exists input_tokens integer;
alter table campaign_versions add column if not exists output_tokens integer;
alter table campaign_versions add column if not exists duration_ms integer;

-- ============================================================
-- campaign_audits — append-only, one row per audit run (a version can be
-- audited more than once; history is preserved, never overwritten).
-- ============================================================
create table if not exists campaign_audits (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  campaign_version_id uuid not null references campaign_versions (id) on delete cascade,

  auditor_provider text not null check (auditor_provider in ('ai', 'deterministic')),
  auditor_model text not null,
  prompt_version text not null,

  score integer not null check (score between 0 and 100),
  status text not null check (status in ('approved', 'warning', 'rejected')),
  report_json jsonb not null,

  input_tokens integer,
  output_tokens integer,
  duration_ms integer,

  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists campaign_audits_organization_id_idx on campaign_audits (organization_id);
create index if not exists campaign_audits_campaign_version_id_idx on campaign_audits (campaign_version_id, created_at desc);

alter table campaign_audits enable row level security;

drop policy if exists "campaign_audits_select_member" on campaign_audits;
create policy "campaign_audits_select_member" on campaign_audits for select to authenticated
  using (is_org_member(organization_id));
drop policy if exists "campaign_audits_insert_member" on campaign_audits;
create policy "campaign_audits_insert_member" on campaign_audits for insert to authenticated
  with check (is_org_member(organization_id));

-- ============================================================
-- campaign_approvals — the human decision. Only ever inserted after the
-- app layer confirms: the referenced audit is for the campaign's current
-- latest version, has no critical issue, and its status isn't 'rejected'.
-- Nothing here executes anything — status just moves to
-- 'approved_for_execution', which the (not-yet-built) Executor will read.
-- ============================================================
create table if not exists campaign_approvals (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  campaign_version_id uuid not null references campaign_versions (id) on delete cascade,
  campaign_audit_id uuid not null references campaign_audits (id) on delete restrict,
  approved_by uuid references profiles (id) on delete set null,
  approved_at timestamptz not null default now(),
  notes text
);

create index if not exists campaign_approvals_campaign_id_idx on campaign_approvals (campaign_id, approved_at desc);

alter table campaign_approvals enable row level security;

drop policy if exists "campaign_approvals_select_member" on campaign_approvals;
create policy "campaign_approvals_select_member" on campaign_approvals for select to authenticated
  using (is_campaign_org_member(campaign_id));
drop policy if exists "campaign_approvals_insert_member" on campaign_approvals;
create policy "campaign_approvals_insert_member" on campaign_approvals for insert to authenticated
  with check (is_campaign_org_member(campaign_id));
