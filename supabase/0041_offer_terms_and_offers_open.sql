-- Open Home Hero: deposit and conditions on offers, a "fewer conditions"
-- seller preference, and a switch to open or close offers on a listing.
-- Run this once in the Supabase SQL Editor.

-- Offers: the buyer's deposit (as a % of their offer) and two more
-- conditions. Older offers leave these empty (unknown).
alter table offers
  add column if not exists deposit_percent numeric
    check (deposit_percent is null or (deposit_percent > 0 and deposit_percent <= 100)),
  add column if not exists subject_to_finance boolean,
  add column if not exists subject_to_sale boolean;

-- Listings: how much the seller cares about the number of conditions, and
-- whether the listing is still taking offers (on by default).
alter table listings
  add column if not exists seller_pref_conditions text
    check (seller_pref_conditions is null or seller_pref_conditions in ('no_preference', 'preferred', 'required')),
  add column if not exists offers_open boolean not null default true;
