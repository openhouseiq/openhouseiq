-- OpenHouseIQ: agent-facing product feedback (distinct from visitor
-- feedback on listings). Used for the initial pilot program — agents
-- get an extended free trial in exchange for feedback after their
-- first month. Run this once in the Supabase SQL Editor.

create table if not exists product_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  overall_rating int not null check (overall_rating between 1 and 5),
  liked_most text,
  biggest_frustration text,
  would_recommend boolean,
  additional_comments text,
  created_at timestamptz not null default now()
);

alter table product_feedback enable row level security;

create policy "Agents can submit their own product feedback"
  on product_feedback for insert
  with check (auth.uid() = user_id);

create policy "Agents can view their own product feedback"
  on product_feedback for select
  using (auth.uid() = user_id);
