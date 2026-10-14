-- OpenHouseIQ security hardening, part 1 of 2.
--
-- Safe to run BEFORE the new code is deployed: everything here is additive
-- or only narrows what a caller can learn, and the currently deployed code
-- keeps working. Run this in the Supabase SQL Editor, then deploy, then run
-- 0032_security_hardening_part2.sql.
--
-- It runs as one transaction: if any statement fails, nothing is applied.

begin;

-- 1. Atomic rate limiter. The count is updated in a single statement, so
--    simultaneous requests can't slip past the limit (the old read-then-write
--    version could). Only the server's service role can call it.
create or replace function check_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into api_rate_limits as r (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set window_start = case
          when r.window_start < now() - make_interval(secs => p_window_seconds) then now()
          else r.window_start
        end,
        count = case
          when r.window_start < now() - make_interval(secs => p_window_seconds) then 1
          else r.count + 1
        end
  returning r.count into v_count;

  -- Occasionally sweep out old rows so the table can't grow without limit.
  if random() < 0.01 then
    delete from api_rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_count <= p_limit;
end;
$$;

revoke all on function check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function check_rate_limit(text, int, int) to service_role;

-- 2. Stripe webhook de-duplication: each event id is recorded once, so a
--    repeat delivery is acknowledged without being processed twice.
create table if not exists stripe_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);
alter table stripe_events enable row level security;
revoke all on stripe_events from anon, authenticated;

-- 3. Two helper functions used inside the security rules were callable by
--    anyone with any user id, which let a stranger check whether a given
--    user has an active subscription or which agency they belong to. They
--    now answer only for the signed-in user's own id (or the server).
create or replace function has_active_access(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (uid = auth.uid() or auth.role() = 'service_role')
    and (
      exists (
        select 1 from subscriptions
        where user_id = uid
        and (
          status = 'active'
          or (status = 'trialing' and trial_ends_at > now())
        )
      )
      or exists (
        select 1 from agency_members am
        join agencies a on a.id = am.agency_id
        where am.user_id = uid
        and am.status = 'active'
        and (
          a.status = 'active'
          or (a.status = 'trialing' and a.trial_ends_at > now())
        )
      )
    ),
    false
  );
$$;

create or replace function user_current_agency_id(uid uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select case
    when uid = auth.uid() or auth.role() = 'service_role' then
      coalesce(
        (select id from agencies where owner_user_id = uid limit 1),
        (select agency_id from agency_members where user_id = uid and status = 'active' limit 1)
      )
    else null
  end;
$$;

-- 4. The agency access rules referred to each other in a circle, which made
--    the database return an error for those tables. Break the circle with
--    two helper functions, and drop the two invitation-by-email rules: the
--    app now reads invitations on the server, for confirmed emails only.
create or replace function is_agency_owner(p_agency uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from agencies where id = p_agency and owner_user_id = auth.uid()
  );
$$;

create or replace function is_agency_member(p_agency uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from agency_members
    where agency_id = p_agency and user_id = auth.uid() and status = 'active'
  );
$$;

drop policy if exists "Members can view their agency" on agencies;
create policy "Members can view their agency"
  on agencies for select
  using (is_agency_member(id));

drop policy if exists "Owners can view their agency's members" on agency_members;
create policy "Owners can view their agency's members"
  on agency_members for select
  using (is_agency_owner(agency_id));

drop policy if exists "Users can view invites sent to their email" on agency_members;
drop policy if exists "Users can view the agency for their pending invite" on agencies;

-- 5. Length limits at the database level too, so oversized text can't be
--    stored even if the server checks were bypassed. NOT VALID means existing
--    rows are left alone; new and changed rows must comply.
alter table feedback drop constraint if exists feedback_text_lengths;
alter table feedback add constraint feedback_text_lengths check (
  char_length(coalesce(name, '')) <= 120
  and char_length(coalesce(email, '')) <= 254
  and char_length(coalesce(phone, '')) <= 40
  and char_length(coalesce(comments, '')) <= 4000
) not valid;

alter table offers drop constraint if exists offers_text_lengths;
alter table offers add constraint offers_text_lengths check (
  char_length(name) <= 120
  and char_length(email) <= 254
  and char_length(coalesce(phone, '')) <= 40
  and char_length(coalesce(notes, '')) <= 4000
) not valid;

alter table applicants drop constraint if exists applicants_text_lengths;
alter table applicants add constraint applicants_text_lengths check (
  char_length(name) <= 120
  and char_length(email) <= 254
  and char_length(coalesce(phone, '')) <= 40
  and char_length(coalesce(employer, '')) <= 200
  and char_length(coalesce(occupation, '')) <= 200
  and char_length(coalesce(pet_details, '')) <= 1000
  and char_length(coalesce(reference_name, '')) <= 120
  and char_length(coalesce(reference_phone, '')) <= 40
  and char_length(coalesce(reference_relationship, '')) <= 120
  and char_length(coalesce(notes, '')) <= 4000
) not valid;

-- 6. File storage limits: images only, with a size cap, so the public
--    buckets can't be used to host other kinds of files.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
where id = 'agent-assets';

update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
where id = 'listing-photos';

commit;
