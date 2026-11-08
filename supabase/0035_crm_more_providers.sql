-- Open Home Hero: allow Follow Up Boss and Box+Dice CRM connections.
-- Run once in the Supabase SQL Editor (after 0034_crm_connections.sql).

alter table crm_connections drop constraint if exists crm_connections_provider_check;
alter table crm_connections add constraint crm_connections_provider_check
  check (provider in ('vaultre', 'rex', 'agentbox', 'boxdice', 'followupboss'));
