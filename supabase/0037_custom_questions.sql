-- Open Home Hero: custom questions on the feedback form.
-- An agent can add up to 3 optional questions of their own to a listing
-- (for example "Would you consider a property in this street?"). Visitors
-- answer them on the feedback form, and the answers are kept with the
-- feedback, together with the question as it was worded at the time.
-- Run this once in the Supabase SQL Editor.

alter table listings
  add column if not exists custom_questions jsonb not null default '[]'::jsonb;

alter table listings
  drop constraint if exists listings_custom_questions_shape;
alter table listings
  add constraint listings_custom_questions_shape
  check (jsonb_typeof(custom_questions) = 'array' and jsonb_array_length(custom_questions) <= 3);

alter table feedback
  add column if not exists custom_answers jsonb not null default '[]'::jsonb;

alter table feedback
  drop constraint if exists feedback_custom_answers_shape;
alter table feedback
  add constraint feedback_custom_answers_shape
  check (jsonb_typeof(custom_answers) = 'array' and jsonb_array_length(custom_answers) <= 3);
