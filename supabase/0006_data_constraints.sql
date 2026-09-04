-- OpenHouseIQ: database-level data validation, so invalid data can't be
-- inserted even by bypassing the app's UI and calling the API directly
-- with the (necessarily public) anon key.
-- Run this once in the Supabase SQL Editor.

alter table listings
  add constraint listings_price_positive check (price > 0),
  add constraint listings_address_not_empty check (btrim(address) <> '');

alter table offers
  add constraint offers_amount_positive check (offer_amount > 0),
  add constraint offers_name_not_empty check (btrim(name) <> ''),
  add constraint offers_email_not_empty check (btrim(email) <> '');

alter table feedback
  add constraint feedback_anonymous_or_named check (
    is_anonymous = true or (name is not null and email is not null)
  );
