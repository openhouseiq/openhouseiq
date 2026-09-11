-- OpenHouseIQ: require a verified card before a new agent gets trial access,
-- to stop trial abuse via disposable accounts. Agents on the pilot_agents
-- allowlist (added by email before they sign up) skip this and get an
-- immediate free trial instead, same as the admin "extend trial" flow.
-- Run this once in the Supabase SQL Editor.

create table if not exists pilot_agents (
  email text primary key,
  added_at timestamptz not null default now()
);

alter table pilot_agents enable row level security;

create or replace function handle_new_user_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_pilot boolean;
begin
  select exists(
    select 1 from pilot_agents where lower(email) = lower(new.email)
  ) into is_pilot;

  if is_pilot then
    insert into subscriptions (user_id, status, trial_ends_at)
    values (new.id, 'trialing', now() + interval '90 days');
  else
    -- No trial yet: this agent must complete Stripe checkout (which starts
    -- its own 14-day trial with a card on file) before has_active_access()
    -- allows anything.
    insert into subscriptions (user_id, status)
    values (new.id, 'incomplete');
  end if;

  return new;
end;
$$;
