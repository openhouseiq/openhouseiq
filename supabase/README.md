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
