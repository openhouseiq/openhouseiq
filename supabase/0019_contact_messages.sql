-- OpenHouseIQ: lets an agent send a support message to the OpenHouseIQ team
-- from Settings. Submissions are readable by the agent who sent them, and by
-- the admin dashboard (via the service role, same pattern as everywhere
-- else admin reads across all agents).
-- Run this once in the Supabase SQL Editor.

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null check (btrim(message) <> ''),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;

create policy "Agents can submit contact messages"
  on contact_messages for insert
  with check (auth.uid() = user_id);

create policy "Agents can view their own contact messages"
  on contact_messages for select
  using (auth.uid() = user_id);
