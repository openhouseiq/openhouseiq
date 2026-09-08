-- OpenHouseIQ: lets an agent record the seller's stated preferences for
-- a listing, so offers can be judged against what the seller actually
-- cares about (not just offer amount). Run this once in the Supabase SQL
-- Editor.

alter table listings
  add column if not exists seller_pref_price text
    check (seller_pref_price in
      ('not_a_priority', 'somewhat_important', 'important', 'very_important', 'top_priority')),
  add column if not exists seller_pref_settlement text
    check (seller_pref_settlement in
      ('asap', '30_days', '45_days', '60_days', '90_plus_days', 'flexible')),
  add column if not exists seller_pref_waive_inspection text
    check (seller_pref_waive_inspection in ('no_preference', 'preferred', 'required')),
  add column if not exists seller_pref_finance_approved text
    check (seller_pref_finance_approved in ('no_preference', 'preferred', 'required')),
  add column if not exists seller_pref_cash_buyer text
    check (seller_pref_cash_buyer in ('no_preference', 'preferred', 'required'));
