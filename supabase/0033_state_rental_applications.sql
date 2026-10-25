-- State-specific rental applications (design: docs/superpowers/specs/2026-10-25-state-rental-forms-design.md).
-- Adds the property's state and the agent's per-listing rental settings to
-- listings, and a new rental_applications table that stores one submission per
-- applicant against the official form version for that state. The old
-- applicants table is left untouched (existing rows stay readable); the old
-- form stops accepting submissions in application code.
-- Additive only: nothing is dropped or rewritten. Run once in the Supabase SQL Editor.

alter table listings
  add column if not exists state text
    check (state in ('QLD', 'VIC', 'SA', 'WA', 'NT', 'NSW')),
  add column if not exists rental_config jsonb not null default '{}'::jsonb,
  add column if not exists leased_on date;

create table if not exists rental_applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  state text not null check (state in ('QLD', 'VIC', 'SA', 'WA', 'NT', 'NSW')),
  form_version text not null check (btrim(form_version) <> ''),
  answers jsonb not null default '{}'::jsonb,
  applicant_name text check (applicant_name is null or btrim(applicant_name) <> ''),
  email text,
  phone text,
  status text not null default 'new'
    check (status in ('new', 'shortlisted', 'successful', 'unsuccessful')),
  consent_name text,
  consent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  anonymised_at timestamptz
);

create index if not exists rental_applications_listing_idx
  on rental_applications (listing_id, created_at desc);

alter table rental_applications enable row level security;

-- No public insert policy: submissions go through the server-side API route
-- (CAPTCHA + rate limited, service_role key), same as offers and feedback.

create policy "Agents can view rental applications on their own listings"
  on rental_applications for select
  using (
    exists (
      select 1 from listings
      where listings.id = rental_applications.listing_id
      and listings.agent_id = auth.uid()
    )
  );

create policy "Agents can update status on their own listings"
  on rental_applications for update
  using (
    exists (
      select 1 from listings
      where listings.id = rental_applications.listing_id
      and listings.agent_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from listings
      where listings.id = rental_applications.listing_id
      and listings.agent_id = auth.uid()
    )
  );

-- Agents can only ever change read_at and status, never the applicant's answers.
revoke update on rental_applications from authenticated;
grant update (read_at, status) on rental_applications to authenticated;

create policy "Agents can delete rental applications on their own listings"
  on rental_applications for delete
  using (
    exists (
      select 1 from listings
      where listings.id = rental_applications.listing_id
      and listings.agent_id = auth.uid()
    )
  );
