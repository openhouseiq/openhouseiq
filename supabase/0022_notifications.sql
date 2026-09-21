-- OpenHouseIQ: agent notifications when a new offer, applicant, or
-- feedback submission comes in — via web push and/or email. Stores each
-- agent's push subscriptions (one browser/device = one row) and an
-- opt-out flag per channel on their profile via user_metadata (no new
-- column needed there). Run this once in the Supabase SQL Editor.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "Agents can manage their own push subscriptions"
  on push_subscriptions for all
  using (auth.uid() = agent_id)
  with check (auth.uid() = agent_id);
