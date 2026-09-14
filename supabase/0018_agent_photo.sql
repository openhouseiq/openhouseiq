-- OpenHouseIQ: store the agent's headshot on the listing so visitors see it
-- on the QR landing page (public listings already allow anyone to read
-- agent_name/agent_email the same way).
-- Run this once in the Supabase SQL Editor.

alter table listings add column if not exists agent_photo_url text;

-- Backfill existing listings from the owning agent's account.
update listings
set agent_photo_url = u.raw_user_meta_data ->> 'photo_url'
from auth.users u
where listings.agent_id = u.id
  and listings.agent_photo_url is null;
