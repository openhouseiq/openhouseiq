-- The listing's country (copied from the agent's profile setting): decides
-- local wording ("open house", "closing") and whether rent is weekly or
-- monthly. Existing listings stay Australian. Run once in the Supabase SQL Editor.

alter table listings
  add column if not exists country text not null default 'AU'
    check (country in ('AU', 'NZ', 'US', 'CA'));

-- Check: every listing should show AU.
select country, count(*) from listings group by country;
