-- OpenHouseIQ: adds car spaces (parking/garage count) to listings, a
-- common field in real estate listings that was missing alongside
-- bedrooms/bathrooms/sqft. Run this once in the Supabase SQL Editor.

alter table listings
  add column if not exists car_spaces int;
