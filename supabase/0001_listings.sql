-- OpenHouseIQ: listings, photos, feedback, offers
-- Run this once in the Supabase SQL Editor.

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references auth.users(id) on delete cascade,
  address text not null,
  price numeric not null,
  description text,
  bedrooms int,
  bathrooms numeric,
  sqft int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  storage_path text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  is_anonymous boolean not null default false,
  name text,
  email text,
  phone text,
  rating int check (rating between 1 and 5),
  comments text,
  created_at timestamptz not null default now()
);

create table if not exists offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  offer_amount numeric not null,
  financing_type text,
  settlement_term text,
  waive_inspection boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

alter table listings enable row level security;
alter table listing_photos enable row level security;
alter table feedback enable row level security;
alter table offers enable row level security;

-- Listings: anyone can view (visitors scan a QR code and land on a public
-- page for a listing), but only the owning agent can create/edit/delete.
create policy "Listings are publicly viewable"
  on listings for select
  using (true);

create policy "Agents can insert their own listings"
  on listings for insert
  with check (auth.uid() = agent_id);

create policy "Agents can update their own listings"
  on listings for update
  using (auth.uid() = agent_id);

create policy "Agents can delete their own listings"
  on listings for delete
  using (auth.uid() = agent_id);

-- Listing photos: publicly viewable, but only the owning agent can manage them.
create policy "Listing photos are publicly viewable"
  on listing_photos for select
  using (true);

create policy "Agents can manage photos on their own listings"
  on listing_photos for all
  using (
    exists (
      select 1 from listings
      where listings.id = listing_photos.listing_id
      and listings.agent_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from listings
      where listings.id = listing_photos.listing_id
      and listings.agent_id = auth.uid()
    )
  );

-- Feedback: anyone (including anonymous visitors) can submit; only the
-- owning agent can read submissions for their listings.
create policy "Anyone can submit feedback"
  on feedback for insert
  with check (true);

create policy "Agents can view feedback on their own listings"
  on feedback for select
  using (
    exists (
      select 1 from listings
      where listings.id = feedback.listing_id
      and listings.agent_id = auth.uid()
    )
  );

-- Offers: same pattern as feedback.
create policy "Anyone can submit offers"
  on offers for insert
  with check (true);

create policy "Agents can view offers on their own listings"
  on offers for select
  using (
    exists (
      select 1 from listings
      where listings.id = offers.listing_id
      and listings.agent_id = auth.uid()
    )
  );
