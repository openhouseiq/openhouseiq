-- OpenHouseIQ: backing store for basic rate limiting on public API routes
-- (feedback, offers, signup-profile). Only ever touched by the service
-- role from server code, so RLS is enabled with no policies — nothing
-- reaches it through the public API. Run this once in the Supabase SQL
-- Editor.

create table if not exists api_rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count int not null default 1
);

alter table api_rate_limits enable row level security;
