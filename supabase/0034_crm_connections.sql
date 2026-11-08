-- Open Home Hero: send visitors to the agent's own CRM (VaultRE first, then
-- Rex and AgentBox once access is granted).
--
-- crm_connections: one connection per agency (managed by the agency owner) or
--   per solo agent. The CRM access token is stored ENCRYPTED by the app
--   (AES-256-GCM, key in the CRM_TOKEN_KEY environment variable) and is never
--   readable from the browser: row-level security is on with no policies, so
--   only the server (service role) can read or write these tables.
-- crm_sync_jobs: one row per visitor submission per connection, so every send
--   is recorded, failed sends are retried, and nothing is ever sent twice.
--
-- Run this once in the Supabase SQL Editor.

create table if not exists crm_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('vaultre', 'rex', 'agentbox')),
  -- Exactly one owner: an agency, or a solo agent.
  agency_id uuid references agencies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  connected_by uuid references auth.users(id) on delete set null,
  token_encrypted text not null,
  status text not null default 'active' check (status in ('active', 'error', 'disconnected')),
  last_error text,
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_connections_one_owner check ((agency_id is null) <> (user_id is null))
);

-- At most one live connection per owner.
create unique index if not exists crm_connections_agency_live
  on crm_connections(agency_id) where agency_id is not null and status <> 'disconnected';
create unique index if not exists crm_connections_user_live
  on crm_connections(user_id) where user_id is not null and status <> 'disconnected';

create table if not exists crm_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references crm_connections(id) on delete cascade,
  kind text not null check (kind in ('feedback', 'offer')),
  source_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  attempts int not null default 0,
  last_error text,
  external_id text,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, kind, source_id)
);

create index if not exists crm_sync_jobs_due
  on crm_sync_jobs(next_attempt_at) where status = 'pending';

alter table crm_connections enable row level security;
alter table crm_sync_jobs enable row level security;
-- No policies on purpose: browser sessions can't read tokens or jobs at all.
