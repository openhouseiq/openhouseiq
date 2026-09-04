-- OpenHouseIQ: store agent name/email on the listing so visitors can see
-- who's hosting the open house (public listings already allow anyone to
-- read these columns).
-- Run this once in the Supabase SQL Editor.

alter table listings add column if not exists agent_name text;
alter table listings add column if not exists agent_email text;

-- Backfill existing listings from the owning agent's account.
update listings
set
  agent_name = coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  agent_email = u.email
from auth.users u
where listings.agent_id = u.id
  and listings.agent_name is null;
