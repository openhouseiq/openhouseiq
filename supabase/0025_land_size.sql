-- OpenHouseIQ: replaces the sqft column with a land_size + unit pair, so
-- agents can record land size in whatever unit suits the property (square
-- metres for a standard block, hectares or acres for acreage). Run this
-- once in the Supabase SQL Editor.

alter table listings
  add column if not exists land_size numeric,
  add column if not exists land_size_unit text
    check (land_size_unit in ('sqm', 'ha', 'acres'));

update listings
set land_size = sqft,
    land_size_unit = 'sqm'
where land_size is null
  and sqft is not null;

alter table listings
  drop column if exists sqft;
