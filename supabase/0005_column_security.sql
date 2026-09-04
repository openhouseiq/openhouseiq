-- OpenHouseIQ: restrict agents to only updating the read_at column on
-- feedback/offers, so visitor-submitted content (rating, comments, offer
-- amount, etc.) can't be altered after the fact, even via a direct API
-- call. The app only ever updates read_at, so this changes no behavior.
-- Run this once in the Supabase SQL Editor.

revoke update on feedback from authenticated;
grant update (read_at) on feedback to authenticated;

revoke update on offers from authenticated;
grant update (read_at) on offers to authenticated;
