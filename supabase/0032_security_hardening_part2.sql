-- OpenHouseIQ security hardening, part 2 of 2.
--
-- Run this ONLY AFTER the new code has been deployed. The old code reads
-- listings straight from the browser's public key, so running this earlier
-- would break the public visit pages until the deploy lands. The new code
-- reads the few public listing details on the server instead.
--
-- It runs as one transaction: if any statement fails, nothing is applied.

begin;

-- 1. Listings (and with them the seller and landlord preference columns and
--    agents' emails) are no longer readable by the public. Only the agent
--    who owns a listing, or the members of its agency, can read the row.
drop policy if exists "Listings are publicly viewable" on listings;
drop policy if exists "Agents can view their own or agency listings" on listings;
create policy "Agents can view their own or agency listings"
  on listings for select
  using (
    (agent_id = auth.uid() and agency_id is null)
    or (agency_id is not null and agency_id = user_current_agency_id(auth.uid()))
  );

drop policy if exists "Listing photos are publicly viewable" on listing_photos;

-- 2. Storage: the photo and asset buckets stay public for display (a file
--    can still be opened by its address), but the public can no longer list
--    every file in them. An agent can list only their own folder.
drop policy if exists "Public read access to listing photos" on storage.objects;
drop policy if exists "Public read access to agent assets" on storage.objects;

drop policy if exists "Agents can list their own listing photos" on storage.objects;
create policy "Agents can list their own listing photos"
  on storage.objects for select
  using (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Agents can list their own assets" on storage.objects;
create policy "Agents can list their own assets"
  on storage.objects for select
  using (
    bucket_id = 'agent-assets'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

commit;
