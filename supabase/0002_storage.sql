-- OpenHouseIQ: storage bucket + policies for listing photos
-- Photos are stored at paths like: {agent_id}/{listing_id}/{filename}
-- Run this once in the Supabase SQL Editor.

insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "Public read access to listing photos"
on storage.objects for select
using (bucket_id = 'listing-photos');

create policy "Agents can upload their own listing photos"
on storage.objects for insert
with check (
  bucket_id = 'listing-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Agents can update their own listing photos"
on storage.objects for update
using (
  bucket_id = 'listing-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Agents can delete their own listing photos"
on storage.objects for delete
using (
  bucket_id = 'listing-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);
