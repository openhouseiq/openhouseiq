-- Open Home Hero: per-listing alerts for agency agents.
-- Every agent in an agency can already see and manage every agency listing.
-- This table records which agents get email and push alerts for a
-- particular listing, so a co-agent can be linked to a property without
-- being alerted about every listing in the agency.
--
-- No row for an agent = the default: the agent who created the listing
-- gets alerts, everyone else doesn't. A row overrides that default
-- (enabled = true turns alerts on, enabled = false turns them off).
-- Server-only: RLS on, no policies (read and written by the app's server).
-- Run this once in the Supabase SQL Editor.

create table if not exists listing_alert_agents (
  listing_id uuid not null references listings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  enabled boolean not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (listing_id, user_id)
);

create index if not exists listing_alert_agents_user_id_idx
  on listing_alert_agents(user_id);

alter table listing_alert_agents enable row level security;
