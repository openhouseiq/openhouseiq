-- OpenHouseIQ: lets an admin reply to a Contact Us message from within
-- the admin dashboard. The reply is stored on the same row (a contact
-- message is a single question + a single reply, not a full thread) and
-- shown to the agent via their existing "Agents can view their own
-- contact messages" select policy — no new read policy needed. Writing
-- reply_text only ever happens through the service role (from the admin
-- API route), so no write policy is added for agents either.
-- Run this once in the Supabase SQL Editor.

alter table contact_messages
  add column if not exists reply_text text,
  add column if not exists replied_at timestamptz;
