-- OpenHouseIQ: referral cash payouts. A referral bonus is first used as
-- credit against the referrer's own next bill. Once that bill is already
-- covered (or the referrer has no bill), the rest is paid out in cash via
-- Stripe Connect, monthly, once at least $50 is owed.
-- Run this once in the Supabase SQL Editor (after 0029_referrals.sql).

-- Each referral bonus is split into the part applied as bill credit and the
-- part owed as cash. balance_cents + cash_cents = credit_cents once allocated.
alter table referral_credits
  add column if not exists balance_cents integer not null default 0,
  add column if not exists cash_cents integer not null default 0,
  add column if not exists payout_id uuid;

-- Bonuses recorded before this change were all applied as bill credit.
update referral_credits
set balance_cents = credit_cents
where balance_cents = 0 and cash_cents = 0;

-- A referrer's Stripe Connect account, used to send them cash payouts.
create table if not exists referral_payout_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_account_id text not null unique,
  created_at timestamptz not null default now()
);

-- One row per cash transfer sent.
create table if not exists referral_payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_cents integer not null,
  currency text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  stripe_transfer_id text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists referral_payouts_user_idx on referral_payouts(user_id);

alter table referral_payout_accounts enable row level security;
alter table referral_payouts enable row level security;

create policy "Agents can view their own payout account"
  on referral_payout_accounts for select
  using (auth.uid() = user_id);

create policy "Agents can view their own payouts"
  on referral_payouts for select
  using (auth.uid() = user_id);
