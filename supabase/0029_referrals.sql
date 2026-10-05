-- OpenHouseIQ: referrals. Every agent gets a referral link. When someone
-- signs up through it and pays, the referrer earns a credit of 10% of each
-- payment the referred account makes for its first 12 months. Credits are
-- applied to the referrer's own Stripe balance, reducing their next bills.
-- Run this once in the Supabase SQL Editor.

create table if not exists referral_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null unique references auth.users(id) on delete cascade,
  code text not null,
  -- Set when the referred account makes its first paid (non-zero) payment;
  -- the 12-month earning window runs from here.
  first_paid_at timestamptz,
  created_at timestamptz not null default now(),
  check (referrer_user_id <> referred_user_id)
);

create index if not exists referrals_referrer_idx on referrals(referrer_user_id);

create table if not exists referral_credits (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references referrals(id) on delete cascade,
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  -- One credit per paid invoice, so a repeated Stripe event never pays twice.
  stripe_invoice_id text not null unique,
  invoice_amount_cents integer not null,
  credit_cents integer not null,
  currency text not null,
  -- Null until the credit has been added to the referrer's Stripe balance
  -- (a referrer with no billing account yet keeps it pending).
  applied_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists referral_credits_referrer_idx on referral_credits(referrer_user_id);

alter table referral_codes enable row level security;
alter table referrals enable row level security;
alter table referral_credits enable row level security;

-- Agents can read their own referral data. All writes happen server-side
-- via the service role key.
create policy "Agents can view their own referral code"
  on referral_codes for select
  using (auth.uid() = user_id);

create policy "Agents can view referrals they made"
  on referrals for select
  using (auth.uid() = referrer_user_id);

create policy "Agents can view their own referral credits"
  on referral_credits for select
  using (auth.uid() = referrer_user_id);
