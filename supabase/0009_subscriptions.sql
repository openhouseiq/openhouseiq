-- OpenHouseIQ: Stripe billing. Every new agent gets a 14-day trial
-- automatically; access drops to read-only once the trial or subscription
-- lapses. Run this once in the Supabase SQL Editor.

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'trialing'
    check (status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
  price_id text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table subscriptions enable row level security;

-- Agents can read their own billing status. All writes happen server-side
-- via the service role key (Stripe checkout/webhook routes), never directly
-- from the browser.
create policy "Agents can view their own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Returns true while an agent should have full (non-read-only) access:
-- an unexpired trial, or a subscription Stripe still considers active.
create or replace function has_active_access(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from subscriptions
    where user_id = uid
    and (
      status = 'active'
      or (status = 'trialing' and trial_ends_at > now())
    )
  );
$$;

-- New agents start a 14-day trial automatically on sign-up.
create or replace function handle_new_user_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into subscriptions (user_id, status, trial_ends_at)
  values (new.id, 'trialing', now() + interval '14 days');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_subscription on auth.users;
create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute function handle_new_user_subscription();

-- Give existing agents (created before this migration) the same 14-day
-- trial so nobody is locked out retroactively.
insert into subscriptions (user_id, status, trial_ends_at)
select id, 'trialing', now() + interval '14 days'
from auth.users
on conflict (user_id) do nothing;

-- Lock down new listing creation to agents with an active trial or
-- subscription; everything else (viewing, editing, feedback/offers) stays
-- available read-only per OpenHouseIQ's lapsed-payment policy.
drop policy if exists "Agents can insert their own listings" on listings;
create policy "Agents can insert listings during trial or active subscription"
  on listings for insert
  with check (auth.uid() = agent_id and has_active_access(auth.uid()));
