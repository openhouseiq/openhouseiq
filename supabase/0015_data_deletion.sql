-- OpenHouseIQ: lets an agent delete a specific feedback or offer entry
-- (e.g. in response to a visitor's data-deletion request). Previously
-- 0005_column_security.sql locked agents out of any write on visitor
-- content except read_at; this adds delete only, so the "can't tamper
-- with content" protection stays intact. Run this once in the Supabase
-- SQL Editor.

create policy "Agents can delete feedback on their own listings"
  on feedback for delete
  using (
    exists (
      select 1 from listings
      where listings.id = feedback.listing_id
      and listings.agent_id = auth.uid()
    )
  );

create policy "Agents can delete offers on their own listings"
  on offers for delete
  using (
    exists (
      select 1 from listings
      where listings.id = offers.listing_id
      and listings.agent_id = auth.uid()
    )
  );
