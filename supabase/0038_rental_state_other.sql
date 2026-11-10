-- Allow 'OTHER' as a rental state: a general application form for agents
-- outside the built Australian states (New Zealand, USA, Canada and elsewhere).
-- Replaces the state check on two tables; no data is changed. Run once in the
-- Supabase SQL Editor.

-- Drop the existing state checks whatever Postgres named them.
do $$
declare c record;
begin
  for c in
    select conrelid::regclass as tbl, conname
    from pg_constraint
    where contype = 'c'
      and conrelid in ('listings'::regclass, 'rental_applications'::regclass)
      and pg_get_constraintdef(oid) like '%''NSW''%'
  loop
    execute format('alter table %s drop constraint %I', c.tbl, c.conname);
  end loop;
end $$;

alter table listings add constraint listings_state_check
  check (state in ('QLD', 'VIC', 'SA', 'WA', 'NT', 'NSW', 'OTHER'));

alter table rental_applications add constraint rental_applications_state_check
  check (state in ('QLD', 'VIC', 'SA', 'WA', 'NT', 'NSW', 'OTHER'));

-- Check: should list both constraints, each including 'OTHER'.
select conrelid::regclass as table_name, conname, pg_get_constraintdef(oid) as rule
from pg_constraint
where conname in ('listings_state_check', 'rental_applications_state_check');
