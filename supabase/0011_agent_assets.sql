-- OpenHouseIQ: storage bucket + policies for agent logo/photo, attached
-- to exported reports. Stored at paths like: {agent_id}/{logo|photo}-{filename}
-- Run this once in the Supabase SQL Editor.

insert into storage.buckets (id, name, public)
values ('agent-assets', 'agent-assets', true)
on conflict (id) do nothing;

create policy "Public read access to agent assets"
on storage.objects for select
using (bucket_id = 'agent-assets');

create policy "Agents can upload their own assets"
on storage.objects for insert
with check (
  bucket_id = 'agent-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Agents can update their own assets"
on storage.objects for update
using (
  bucket_id = 'agent-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Agents can delete their own assets"
on storage.objects for delete
using (
  bucket_id = 'agent-assets'
  and auth.uid()::text = (storage.foldername(name))[1]
);
