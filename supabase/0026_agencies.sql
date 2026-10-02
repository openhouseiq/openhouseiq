-- OpenHouseIQ: agency-level subscriptions. An agency is billed as one
-- Stripe subscription with quantity = number of agent seats, using
-- Stripe's volume-tiered pricing so the whole agency gets the discount
-- band its total headcount falls into:
--   1-2 agents: full price
--   3-6 agents: 10% off
--   7-19 agents: 15% off
--   20+ agents: 20% off
-- Run this once in the Supabase SQL Editor.

create table if not exists agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  price_id text,
  billing_interval text check (billing_interval in ('month', 'year')),
  status text not null default 'incomplete'
    check (status in ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'incomplete_expired', 'unpaid')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agency_members (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  status text not null default 'invited'
    check (status in ('invited', 'active', 'removed')),
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  removed_at timestamptz,
  unique (agency_id, email)
);

create index if not exists agency_members_user_id_idx on agency_members(user_id);
create index if not exists agency_members_agency_id_idx on agency_members(agency_id);

alter table agencies enable row level security;
alter table agency_members enable row level security;

-- The owner manages their own agency. All writes happen server-side via
-- the service role key (agency API routes, Stripe webhook).
create policy "Owners can view their own agency"
  on agencies for select
  using (auth.uid() = owner_user_id);

-- A member can see the agency row they belong to (for "part of this
-- agency" display), not just the owner.
create policy "Members can view their agency"
  on agencies for select
  using (
    exists (
      select 1 from agency_members
      where agency_members.agency_id = agencies.id
      and agency_members.user_id = auth.uid()
      and agency_members.status = 'active'
    )
  );

create policy "Owners can view their agency's members"
  on agency_members for select
  using (
    exists (
      select 1 from agencies
      where agencies.id = agency_members.agency_id
      and agencies.owner_user_id = auth.uid()
    )
  );

create policy "Members can view their own membership row"
  on agency_members for select
  using (auth.uid() = user_id);

-- Lets a signed-in user see a pending invite addressed to their own email,
-- before they've accepted it and a user_id has been attached to the row.
create policy "Users can view invites sent to their email"
  on agency_members for select
  using (lower(email) = lower(auth.email()) and status = 'invited');

-- Lets an invited (not-yet-member) user see the inviting agency's name,
-- so the invite banner can say who they've been invited to join.
create policy "Users can view the agency for their pending invite"
  on agencies for select
  using (
    exists (
      select 1 from agency_members
      where agency_members.agency_id = agencies.id
      and lower(agency_members.email) = lower(auth.email())
      and agency_members.status = 'invited'
    )
  );

-- Extends has_active_access (defined in 0009_subscriptions.sql) to also
-- grant access through an active agency membership whose agency
-- subscription is active or still within its trial.
create or replace function has_active_access(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select
    exists (
      select 1 from subscriptions
      where user_id = uid
      and (
        status = 'active'
        or (status = 'trialing' and trial_ends_at > now())
      )
    )
    or exists (
      select 1 from agency_members am
      join agencies a on a.id = am.agency_id
      where am.user_id = uid
      and am.status = 'active'
      and (
        a.status = 'active'
        or (a.status = 'trialing' and a.trial_ends_at > now())
      )
    );
$$;
