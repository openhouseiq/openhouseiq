-- OpenHouseIQ: richer, structured visitor feedback so agents get
-- actionable data instead of just a single star rating + free text.
-- The old `rating` column is left in place (unused going forward) so
-- no existing data is touched.
-- Run this once in the Supabase SQL Editor.

alter table feedback
  add column if not exists interest_level text,
  add column if not exists rating_price int,
  add column if not exists rating_condition int,
  add column if not exists rating_location int,
  add column if not exists rating_layout int,
  add column if not exists pre_approved boolean,
  add column if not exists working_with_agent boolean,
  add column if not exists purchase_timeframe text,
  add column if not exists wants_followup boolean;

alter table feedback
  add constraint feedback_interest_level_valid check (
    interest_level is null or interest_level in (
      'not_interested', 'considering', 'very_interested', 'ready_to_offer'
    )
  ),
  add constraint feedback_rating_price_valid check (rating_price between 1 and 5),
  add constraint feedback_rating_condition_valid check (rating_condition between 1 and 5),
  add constraint feedback_rating_location_valid check (rating_location between 1 and 5),
  add constraint feedback_rating_layout_valid check (rating_layout between 1 and 5),
  add constraint feedback_purchase_timeframe_valid check (
    purchase_timeframe is null or purchase_timeframe in (
      'immediately', 'one_to_three_months', 'three_to_six_months', 'six_plus_months', 'just_browsing'
    )
  );
