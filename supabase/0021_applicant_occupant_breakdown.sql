-- OpenHouseIQ: break the applicant's "number of occupants" down into
-- adults and children (under 16), so landlords see who's actually moving
-- in rather than just a headcount. number_of_occupants stays as the
-- total, validated (at the DB level too) to equal adults + children.
-- Run this once in the Supabase SQL Editor.

alter table applicants
  add column if not exists number_of_adults int check (number_of_adults > 0),
  add column if not exists number_of_children int check (number_of_children >= 0);

alter table applicants
  add constraint applicants_occupants_breakdown_matches_total
    check (
      number_of_adults is null
      or number_of_children is null
      or number_of_occupants is null
      or number_of_occupants = number_of_adults + number_of_children
    );
