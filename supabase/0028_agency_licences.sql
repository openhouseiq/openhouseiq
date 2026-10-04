-- OpenHouseIQ: agency licences. An agency now buys a fixed number of
-- licences (seats) up front and assigns agents to them.
--   seats          = licences the agency has paid for in the current period
--   pending_seats  = a scheduled reduction that takes effect at the next
--                    renewal (null when nothing is scheduled)
-- Run this once in the Supabase SQL Editor.

alter table agencies
  add column if not exists seats integer not null default 1
    check (seats >= 1),
  add column if not exists pending_seats integer
    check (pending_seats is null or pending_seats >= 1);

-- Any agency created before this migration was billed per active member,
-- so start its licence count at its current number of active members.
update agencies a
set seats = greatest(
  1,
  (select count(*) from agency_members m where m.agency_id = a.id and m.status = 'active')
);
