# Database migrations

Run these in the Supabase SQL Editor, in order, on a fresh project. Each
one is idempotent-ish (safe to re-run individual statements won't be, since
`create policy` has no `if not exists`, but `create table`/`alter table` do).

| File | What it does |
|---|---|
| `0001_listings.sql` | Creates `listings`, `listing_photos`, `feedback`, `offers` tables and their row-level security policies |
| `0002_storage.sql` | Creates the `listing-photos` storage bucket and its access policies |
| `0003_agent_details.sql` | Adds `agent_name`/`agent_email` to `listings` so visitors see who's hosting |
| `0004_read_tracking.sql` | Adds `read_at` to `feedback`/`offers` for the dashboard's "new" badges |
| `0005_column_security.sql` | Restricts agents to only updating the `read_at` column on `feedback`/`offers`, so visitor-submitted content can't be altered |
| `0006_data_constraints.sql` | Adds CHECK constraints (positive prices/amounts, non-empty required text) so invalid data can't be inserted even via a direct API call |
| `0007_captcha_lockdown.sql` | Removes the public insert policies on `feedback`/`offers` — submissions now only go through the CAPTCHA-verified `/api/feedback` and `/api/offers` routes, which use the service role key |
| `0008_feedback_metrics.sql` | Adds structured feedback fields (interest level, category ratings, buyer readiness, follow-up preference) so agents get actionable data, not just a star rating and free text |
| `0009_subscriptions.sql` | Adds the `subscriptions` table (synced from Stripe via webhook), auto-starts a 14-day trial for every new agent, and restricts new listing creation to agents with an active trial or subscription |
| `0010_car_spaces.sql` | Adds `car_spaces` to `listings` |
| `0011_agent_assets.sql` | Creates the `agent-assets` storage bucket for agent logo/photo (attached to exported reports) |
| `0012_seller_preferences.sql` | Adds seller preference fields to `listings` (price importance, settlement timing, waive inspection, finance approved, cash buyer) so offers can be judged against what the seller actually wants |
| `0013_settlement_constraint.sql` | Normalizes existing `offers.settlement_term` free text to the fixed settlement values and locks the column to that set, so offers can be compared directly against seller preferences |
| `0014_rate_limits.sql` | Backing table for basic rate limiting on public API routes (feedback, offers, signup-profile) |
| `0015_data_deletion.sql` | Lets agents delete individual feedback/offer entries (visitor data-deletion requests) — previously blocked entirely by RLS |
| `0016_product_feedback.sql` | Adds `product_feedback` — agent-facing feedback about OpenHouseIQ itself (distinct from visitor feedback on listings), used for the pilot program |
