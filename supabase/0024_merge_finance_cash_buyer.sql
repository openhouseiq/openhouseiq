-- OpenHouseIQ: merges the separate "Finance approved" and "Cash buyer"
-- seller preferences into a single "Finance" preference, since they were
-- really two levels of the same question (how a buyer is funding the
-- purchase). Run this once in the Supabase SQL Editor.

alter table listings
  add column if not exists seller_pref_finance text
    check (seller_pref_finance in
      ('finance_preferred', 'finance_required', 'cash_preferred', 'cash_required'));

update listings
set seller_pref_finance = case
  when seller_pref_cash_buyer = 'required' then 'cash_required'
  when seller_pref_finance_approved = 'required' then 'finance_required'
  when seller_pref_cash_buyer = 'preferred' then 'cash_preferred'
  when seller_pref_finance_approved = 'preferred' then 'finance_preferred'
  else null
end
where seller_pref_finance is null
  and (seller_pref_finance_approved is not null or seller_pref_cash_buyer is not null);

alter table listings
  drop column if exists seller_pref_finance_approved,
  drop column if exists seller_pref_cash_buyer;
