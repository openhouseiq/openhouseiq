-- OpenHouseIQ: feedback/offer submissions now go through a server-side
-- API route that verifies a Cloudflare Turnstile CAPTCHA before inserting
-- (using the service_role key, which bypasses RLS entirely). Remove the
-- old policies that let anyone insert directly with just the public
-- anon/publishable key, so the CAPTCHA can't be bypassed by calling the
-- database directly.
-- Run this once in the Supabase SQL Editor.

drop policy if exists "Anyone can submit feedback" on feedback;
drop policy if exists "Anyone can submit offers" on offers;
