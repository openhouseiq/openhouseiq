-- OpenHouseIQ: buyers now pick settlement term from the same fixed list
-- sellers use to state their preference, so offers can be compared
-- directly against what the seller wants (needed for offer ranking).
-- Run this once in the Supabase SQL Editor.

-- Normalize existing free-text values (e.g. "45 days", "30 days ") to the
-- new fixed set before locking it down. Anything unrecognized becomes
-- null rather than left invalid.
update offers
set settlement_term = case
  when trim(lower(settlement_term)) in ('asap', 'as soon as possible') then 'asap'
  when trim(lower(settlement_term)) in ('30 days', '30days', '30') then '30_days'
  when trim(lower(settlement_term)) in ('45 days', '45days', '45') then '45_days'
  when trim(lower(settlement_term)) in ('60 days', '60days', '60') then '60_days'
  when trim(lower(settlement_term)) in ('90 days', '90+ days', '90days', '90') then '90_plus_days'
  when trim(lower(settlement_term)) in ('flexible', 'no preference', 'any') then 'flexible'
  when settlement_term in ('asap', '30_days', '45_days', '60_days', '90_plus_days', 'flexible')
    then settlement_term
  else null
end
where settlement_term is not null;

alter table offers
  add constraint offers_settlement_term_valid check (
    settlement_term is null or settlement_term in
      ('asap', '30_days', '45_days', '60_days', '90_plus_days', 'flexible')
  );
