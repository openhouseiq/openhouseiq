-- OpenHouseIQ: when a listing is created by an agent who's part of an
-- agency, the listing (and its feedback/offers/applicants) belongs to the
-- agency, not just the individual agent. If that agent later leaves or is
-- removed, they lose access to it and the agency keeps it — the agency
-- never loses a listing just because the agent who created it moved on.
-- Run this once in the Supabase SQL Editor.

alter table listings
  add column if not exists agency_id uuid references agencies(id) on delete set null;

-- Returns the agency a user currently belongs to — as owner, or as an
-- active member — or null if they're not part of one. A user can be
-- part of at most one agency at a time (enforced at the application
-- level, not the database), so this returns a single id.
create or replace function user_current_agency_id(uid uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select id from agencies where owner_user_id = uid limit 1),
    (select agency_id from agency_members where user_id = uid and status = 'active' limit 1)
  );
$$;

-- Listings: insert/update/delete now also allow any CURRENT active member
-- of the listing's agency (not just the original creating agent), and
-- stop allowing a departed agent to keep managing a listing that belongs
-- to the agency they left.
drop policy if exists "Agents can insert listings during trial or active subscription" on listings;
create policy "Agents can insert listings during trial or active subscription"
  on listings for insert
  with check (
    auth.uid() = agent_id
    and has_active_access(auth.uid())
    and (agency_id is null or agency_id = user_current_agency_id(auth.uid()))
  );

drop policy if exists "Agents can update their own listings" on listings;
create policy "Agents can update their own listings"
  on listings for update
  using (
    (agent_id = auth.uid() and agency_id is null)
    or (agency_id is not null and agency_id = user_current_agency_id(auth.uid()))
  );

drop policy if exists "Agents can delete their own listings" on listings;
create policy "Agents can delete their own listings"
  on listings for delete
  using (
    (agent_id = auth.uid() and agency_id is null)
    or (agency_id is not null and agency_id = user_current_agency_id(auth.uid()))
  );

-- Listing photos: same ownership rule as listings.
drop policy if exists "Agents can manage photos on their own listings" on listing_photos;
create policy "Agents can manage photos on their own listings"
  on listing_photos for all
  using (
    exists (
      select 1 from listings
      where listings.id = listing_photos.listing_id
      and (
        (listings.agent_id = auth.uid() and listings.agency_id is null)
        or (listings.agency_id is not null and listings.agency_id = user_current_agency_id(auth.uid()))
      )
    )
  )
  with check (
    exists (
      select 1 from listings
      where listings.id = listing_photos.listing_id
      and (
        (listings.agent_id = auth.uid() and listings.agency_id is null)
        or (listings.agency_id is not null and listings.agency_id = user_current_agency_id(auth.uid()))
      )
    )
  );

-- Feedback: view, mark-as-read, and delete all follow the same rule.
drop policy if exists "Agents can view feedback on their own listings" on feedback;
create policy "Agents can view feedback on their own listings"
  on feedback for select
  using (
    exists (
      select 1 from listings
      where listings.id = feedback.listing_id
      and (
        (listings.agent_id = auth.uid() and listings.agency_id is null)
        or (listings.agency_id is not null and listings.agency_id = user_current_agency_id(auth.uid()))
      )
    )
  );

drop policy if exists "Agents can mark feedback as read on their own listings" on feedback;
create policy "Agents can mark feedback as read on their own listings"
  on feedback for update
  using (
    exists (
      select 1 from listings
      where listings.id = feedback.listing_id
      and (
        (listings.agent_id = auth.uid() and listings.agency_id is null)
        or (listings.agency_id is not null and listings.agency_id = user_current_agency_id(auth.uid()))
      )
    )
  )
  with check (
    exists (
      select 1 from listings
      where listings.id = feedback.listing_id
      and (
        (listings.agent_id = auth.uid() and listings.agency_id is null)
        or (listings.agency_id is not null and listings.agency_id = user_current_agency_id(auth.uid()))
      )
    )
  );

drop policy if exists "Agents can delete feedback on their own listings" on feedback;
create policy "Agents can delete feedback on their own listings"
  on feedback for delete
  using (
    exists (
      select 1 from listings
      where listings.id = feedback.listing_id
      and (
        (listings.agent_id = auth.uid() and listings.agency_id is null)
        or (listings.agency_id is not null and listings.agency_id = user_current_agency_id(auth.uid()))
      )
    )
  );

-- Offers: same pattern as feedback.
drop policy if exists "Agents can view offers on their own listings" on offers;
create policy "Agents can view offers on their own listings"
  on offers for select
  using (
    exists (
      select 1 from listings
      where listings.id = offers.listing_id
      and (
        (listings.agent_id = auth.uid() and listings.agency_id is null)
        or (listings.agency_id is not null and listings.agency_id = user_current_agency_id(auth.uid()))
      )
    )
  );

drop policy if exists "Agents can mark offers as read on their own listings" on offers;
create policy "Agents can mark offers as read on their own listings"
  on offers for update
  using (
    exists (
      select 1 from listings
      where listings.id = offers.listing_id
      and (
        (listings.agent_id = auth.uid() and listings.agency_id is null)
        or (listings.agency_id is not null and listings.agency_id = user_current_agency_id(auth.uid()))
      )
    )
  )
  with check (
    exists (
      select 1 from listings
      where listings.id = offers.listing_id
      and (
        (listings.agent_id = auth.uid() and listings.agency_id is null)
        or (listings.agency_id is not null and listings.agency_id = user_current_agency_id(auth.uid()))
      )
    )
  );

drop policy if exists "Agents can delete offers on their own listings" on offers;
create policy "Agents can delete offers on their own listings"
  on offers for delete
  using (
    exists (
      select 1 from listings
      where listings.id = offers.listing_id
      and (
        (listings.agent_id = auth.uid() and listings.agency_id is null)
        or (listings.agency_id is not null and listings.agency_id = user_current_agency_id(auth.uid()))
      )
    )
  );

-- Applicants (rentals): same pattern.
drop policy if exists "Agents can view applicants on their own listings" on applicants;
create policy "Agents can view applicants on their own listings"
  on applicants for select
  using (
    exists (
      select 1 from listings
      where listings.id = applicants.listing_id
      and (
        (listings.agent_id = auth.uid() and listings.agency_id is null)
        or (listings.agency_id is not null and listings.agency_id = user_current_agency_id(auth.uid()))
      )
    )
  );

drop policy if exists "Agents can mark applicants as read on their own listings" on applicants;
create policy "Agents can mark applicants as read on their own listings"
  on applicants for update
  using (
    exists (
      select 1 from listings
      where listings.id = applicants.listing_id
      and (
        (listings.agent_id = auth.uid() and listings.agency_id is null)
        or (listings.agency_id is not null and listings.agency_id = user_current_agency_id(auth.uid()))
      )
    )
  )
  with check (
    exists (
      select 1 from listings
      where listings.id = applicants.listing_id
      and (
        (listings.agent_id = auth.uid() and listings.agency_id is null)
        or (listings.agency_id is not null and listings.agency_id = user_current_agency_id(auth.uid()))
      )
    )
  );

drop policy if exists "Agents can delete applicants on their own listings" on applicants;
create policy "Agents can delete applicants on their own listings"
  on applicants for delete
  using (
    exists (
      select 1 from listings
      where listings.id = applicants.listing_id
      and (
        (listings.agent_id = auth.uid() and listings.agency_id is null)
        or (listings.agency_id is not null and listings.agency_id = user_current_agency_id(auth.uid()))
      )
    )
  );
