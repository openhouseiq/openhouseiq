-- OpenHouseIQ: rental listings. Adds a listing_type column (sale vs
-- rental), a parallel set of landlord preferences (alongside the existing
-- seller_pref_* columns used for sales), and a new applicants table that
-- captures rental pre-qualification submissions — parallel to offers, but
-- with rental-specific fields (employment, desired lease term, pets,
-- references) instead of purchase ones. This is a pre-qualification tool
-- for agents to shortlist applicants for a landlord; it does not replace
-- an RTA tenancy application. Run this once in the Supabase SQL Editor.

alter table listings
  add column if not exists listing_type text not null default 'sale'
    check (listing_type in ('sale', 'rental')),
  add column if not exists landlord_pref_pets text
    check (landlord_pref_pets in ('no_preference', 'not_allowed', 'allowed')),
  add column if not exists landlord_pref_min_lease_term text
    check (landlord_pref_min_lease_term in
      ('month_to_month', '6_months', '12_months', '24_months', 'flexible')),
  add column if not exists landlord_pref_smoking text
    check (landlord_pref_smoking in ('no_preference', 'not_allowed', 'allowed')),
  add column if not exists landlord_pref_employment_verification text
    check (landlord_pref_employment_verification in
      ('no_preference', 'preferred', 'required'));

create table if not exists applicants (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  email text not null check (btrim(email) <> ''),
  phone text,
  employer text,
  occupation text,
  income_range text
    check (income_range in ('under_50k', '50k_75k', '75k_100k', '100k_150k', '150k_plus')),
  can_provide_proof_of_income boolean not null default false,
  desired_move_in_date date,
  desired_lease_term text
    check (desired_lease_term in ('month_to_month', '6_months', '12_months', '24_months')),
  has_pets boolean not null default false,
  pet_details text,
  number_of_occupants int check (number_of_occupants > 0),
  is_smoker boolean not null default false,
  reference_name text,
  reference_phone text,
  reference_relationship text,
  notes text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table applicants enable row level security;

-- No public insert policy: applicant submissions go through a server-side
-- API route (CAPTCHA + rate limited, service_role key), same as offers and
-- feedback since 0007_captcha_lockdown.sql.

create policy "Agents can view applicants on their own listings"
  on applicants for select
  using (
    exists (
      select 1 from listings
      where listings.id = applicants.listing_id
      and listings.agent_id = auth.uid()
    )
  );

create policy "Agents can mark applicants as read on their own listings"
  on applicants for update
  using (
    exists (
      select 1 from listings
      where listings.id = applicants.listing_id
      and listings.agent_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from listings
      where listings.id = applicants.listing_id
      and listings.agent_id = auth.uid()
    )
  );

-- Same column-lockdown pattern as 0005_column_security.sql: agents can only
-- ever update read_at, never the applicant's submitted content.
revoke update on applicants from authenticated;
grant update (read_at) on applicants to authenticated;

create policy "Agents can delete applicants on their own listings"
  on applicants for delete
  using (
    exists (
      select 1 from listings
      where listings.id = applicants.listing_id
      and listings.agent_id = auth.uid()
    )
  );
