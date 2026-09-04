-- OpenHouseIQ: track whether an agent has viewed each feedback/offer
-- submission, so the dashboard can show "new" badges.
-- Run this once in the Supabase SQL Editor.

alter table feedback add column if not exists read_at timestamptz;
alter table offers add column if not exists read_at timestamptz;

create policy "Agents can mark feedback as read on their own listings"
  on feedback for update
  using (
    exists (
      select 1 from listings
      where listings.id = feedback.listing_id
      and listings.agent_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from listings
      where listings.id = feedback.listing_id
      and listings.agent_id = auth.uid()
    )
  );

create policy "Agents can mark offers as read on their own listings"
  on offers for update
  using (
    exists (
      select 1 from listings
      where listings.id = offers.listing_id
      and listings.agent_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from listings
      where listings.id = offers.listing_id
      and listings.agent_id = auth.uid()
    )
  );
