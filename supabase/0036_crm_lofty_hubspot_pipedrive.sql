-- Open Home Hero: allow Lofty, HubSpot and Pipedrive CRM connections.
-- Run once in the Supabase SQL Editor (after 0035_crm_more_providers.sql).

alter table crm_connections drop constraint if exists crm_connections_provider_check;
alter table crm_connections add constraint crm_connections_provider_check
  check (provider in ('vaultre', 'rex', 'agentbox', 'boxdice', 'followupboss', 'lofty', 'hubspot', 'pipedrive'));
