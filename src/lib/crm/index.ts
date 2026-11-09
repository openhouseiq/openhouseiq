import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptToken, encryptToken } from "./crypto";
import {
  feedbackRecord,
  offerRecord,
  type CrmFeedbackRow,
  type CrmKind,
  type CrmOfferRow,
  type CrmRecord,
} from "./record";
import { CrmSendError } from "./errors";
import { sendToVaultre, testVaultre, vaultreConfigured, vaultreOauthConfigured } from "./vaultre";
import { followUpBossConfigured, sendToFollowUpBoss, testFollowUpBoss } from "./followupboss";
import { sendToLofty, testLofty } from "./lofty";
import { sendToHubSpot, testHubSpot } from "./hubspot";
import { sendToPipedrive, testPipedrive } from "./pipedrive";

export type ProviderId =
  | "vaultre"
  | "rex"
  | "agentbox"
  | "boxdice"
  | "followupboss"
  | "lofty"
  | "hubspot"
  | "pipedrive";

type Provider = {
  name: string;
  /** Live for agents to connect (our integrator access is in place). */
  available: () => boolean;
  /** One-click Connect button (OAuth) rather than pasting a token. */
  oauth: () => boolean;
  send?: (token: string, record: CrmRecord) => Promise<string | null>;
  test?: (token: string) => Promise<void>;
};

export const PROVIDERS: Record<ProviderId, Provider> = {
  vaultre: { name: "VaultRE", available: vaultreConfigured, oauth: vaultreOauthConfigured, send: sendToVaultre, test: testVaultre },
  // Waiting on API access from Rex and Reapit. Shown as "coming soon".
  rex: { name: "Rex", available: () => false, oauth: () => false },
  agentbox: { name: "AgentBox", available: () => false, oauth: () => false },
  // Owned by MRI (like VaultRE). Waiting to hear if our VaultRE access covers it.
  boxdice: { name: "Box+Dice", available: () => false, oauth: () => false },
  // Popular in the US. Agents paste their own Follow Up Boss API key.
  followupboss: {
    name: "Follow Up Boss",
    available: followUpBossConfigured,
    oauth: () => false,
    send: sendToFollowUpBoss,
    test: testFollowUpBoss,
  },
  // Agents paste their own API key; no integrator approval needed.
  lofty: { name: "Lofty", available: () => true, oauth: () => false, send: sendToLofty, test: testLofty },
  hubspot: { name: "HubSpot", available: () => true, oauth: () => false, send: sendToHubSpot, test: testHubSpot },
  pipedrive: { name: "Pipedrive", available: () => true, oauth: () => false, send: sendToPipedrive, test: testPipedrive },
};

export const isProviderId = (v: unknown): v is ProviderId =>
  typeof v === "string" && v in PROVIDERS;

export type ConnectionOwner = { agencyId: string } | { userId: string };

export type ConnectionRow = {
  id: string;
  provider: ProviderId;
  agency_id: string | null;
  user_id: string | null;
  token_encrypted: string;
  status: "active" | "error" | "disconnected";
  last_error: string | null;
  last_sent_at: string | null;
  created_at: string;
};

const CONNECTION_COLUMNS =
  "id, provider, agency_id, user_id, token_encrypted, status, last_error, last_sent_at, created_at";

function ownerFilter<T extends { eq: (c: string, v: string) => T }>(q: T, owner: ConnectionOwner): T {
  return "agencyId" in owner ? q.eq("agency_id", owner.agencyId) : q.eq("user_id", owner.userId);
}

/** The owner's current (not disconnected) connection, if any. */
export async function getConnection(service: SupabaseClient, owner: ConnectionOwner): Promise<ConnectionRow | null> {
  const q = service.from("crm_connections").select(CONNECTION_COLUMNS).neq("status", "disconnected");
  const { data } = await ownerFilter(q, owner).maybeSingle();
  return (data as ConnectionRow | null) ?? null;
}

/** Listings owned by an agency use the agency's CRM; otherwise the agent's own. */
export async function getConnectionForListing(
  service: SupabaseClient,
  listing: { agent_id: string; agency_id: string | null },
): Promise<ConnectionRow | null> {
  return getConnection(service, listing.agency_id ? { agencyId: listing.agency_id } : { userId: listing.agent_id });
}

/**
 * Saves (or refreshes) an owner's connection. Reconnecting after an error keeps
 * the same connection, so visitors waiting to be sent go out once it works.
 */
export async function saveConnection(
  service: SupabaseClient,
  owner: ConnectionOwner,
  provider: ProviderId,
  token: string,
  connectedBy: string,
): Promise<void> {
  const existing = await getConnection(service, owner);
  const fields = {
    provider,
    token_encrypted: encryptToken(token),
    status: "active",
    last_error: null,
    connected_by: connectedBy,
    updated_at: new Date().toISOString(),
  };
  if (existing && existing.provider === provider) {
    const { error } = await service.from("crm_connections").update(fields).eq("id", existing.id);
    if (error) throw new Error(error.message);
    // Anything held back while the connection was broken can go now.
    await service
      .from("crm_sync_jobs")
      .update({ next_attempt_at: new Date().toISOString() })
      .eq("connection_id", existing.id)
      .eq("status", "pending");
    return;
  }
  if (existing) await disconnect(service, owner);
  const { error } = await service.from("crm_connections").insert({
    ...fields,
    agency_id: "agencyId" in owner ? owner.agencyId : null,
    user_id: "userId" in owner ? owner.userId : null,
  });
  if (error) throw new Error(error.message);
}

export async function disconnect(service: SupabaseClient, owner: ConnectionOwner): Promise<void> {
  const q = service
    .from("crm_connections")
    .update({ status: "disconnected", token_encrypted: "", updated_at: new Date().toISOString() })
    .neq("status", "disconnected");
  await ownerFilter(q, owner);
}

/** Checks a token against the CRM before it's saved. Throws a readable error. */
export async function testToken(provider: ProviderId, token: string): Promise<void> {
  const p = PROVIDERS[provider];
  if (!p.available() || !p.test) throw new Error(`${p.name} isn't available yet.`);
  await p.test(token);
}

// ---------------------------------------------------------------------------
// The send queue

/** Minutes to wait after each failed attempt; after the last one it stops. */
export const RETRY_MINUTES = [5, 30, 120, 720, 1440];

type JobRow = {
  id: string;
  connection_id: string;
  kind: CrmKind;
  source_id: string;
  status: string;
  attempts: number;
};

async function loadRecord(service: SupabaseClient, kind: CrmKind, sourceId: string): Promise<CrmRecord | null | "gone"> {
  const table = kind === "feedback" ? "feedback" : "offers";
  const { data: row } = await service.from(table).select("*").eq("id", sourceId).maybeSingle();
  if (!row) return "gone";
  const { data: listing } = await service
    .from("listings")
    .select("id, address")
    .eq("id", (row as { listing_id: string }).listing_id)
    .maybeSingle();
  const l = { id: (listing?.id as string) ?? "", address: (listing?.address as string | null) ?? null };
  return kind === "feedback" ? feedbackRecord(row as CrmFeedbackRow, l) : offerRecord(row as CrmOfferRow, l);
}

/** Sends one queued visitor. Never throws. */
export async function processJob(service: SupabaseClient, jobId: string): Promise<JobRow["status"]> {
  const now = new Date();
  const { data: job } = await service.from("crm_sync_jobs").select("*").eq("id", jobId).maybeSingle();
  if (!job || (job as JobRow).status !== "pending") return (job as JobRow | null)?.status ?? "missing";
  const j = job as JobRow;

  const finish = async (fields: Record<string, unknown>) => {
    await service.from("crm_sync_jobs").update({ ...fields, updated_at: now.toISOString() }).eq("id", j.id);
  };

  const { data: conn } = await service
    .from("crm_connections")
    .select(CONNECTION_COLUMNS)
    .eq("id", j.connection_id)
    .maybeSingle();
  const c = conn as ConnectionRow | null;
  if (!c || c.status === "disconnected") {
    await finish({ status: "skipped", last_error: "CRM disconnected." });
    return "skipped";
  }
  const provider = PROVIDERS[c.provider];
  if (!provider.available() || !provider.send) {
    await finish({ next_attempt_at: new Date(now.getTime() + 24 * 3600_000).toISOString() });
    return "pending";
  }
  if (c.status === "error") {
    // Held until the agency reconnects (saveConnection releases it).
    await finish({ next_attempt_at: new Date(now.getTime() + 24 * 3600_000).toISOString() });
    return "pending";
  }

  const record = await loadRecord(service, j.kind, j.source_id);
  if (record === "gone") {
    await finish({ status: "skipped", last_error: "The visitor's entry was deleted." });
    return "skipped";
  }
  if (record === null) {
    await finish({ status: "skipped", last_error: "Anonymous feedback has no contact details to send." });
    return "skipped";
  }

  let token: string;
  try {
    token = decryptToken(c.token_encrypted);
  } catch {
    // The encryption key changed, so the stored token is unreadable. Ask the
    // agency to reconnect; visitors are held until they do.
    token = "";
  }

  try {
    if (!token) throw new CrmSendError("Stored access can't be read. Please reconnect.", false, true);
    const externalId = await provider.send(token, record);
    await finish({ status: "sent", attempts: j.attempts + 1, external_id: externalId, last_error: null });
    await service.from("crm_connections").update({ last_sent_at: now.toISOString() }).eq("id", c.id);
    return "sent";
  } catch (error) {
    const err = error instanceof CrmSendError ? error : new CrmSendError((error as Error).message, true);
    const attempts = j.attempts + 1;
    if (err.authFailed) {
      await service
        .from("crm_connections")
        .update({ status: "error", last_error: err.message, updated_at: now.toISOString() })
        .eq("id", c.id);
      await finish({ attempts, last_error: err.message, next_attempt_at: new Date(now.getTime() + 24 * 3600_000).toISOString() });
      return "pending";
    }
    const wait = RETRY_MINUTES[attempts - 1];
    if (!err.retryable || wait === undefined) {
      await finish({ status: "failed", attempts, last_error: err.message });
      return "failed";
    }
    await finish({ attempts, last_error: err.message, next_attempt_at: new Date(now.getTime() + wait * 60_000).toISOString() });
    return "pending";
  }
}

/**
 * Call after a visitor's feedback or offer is saved. Queues it for the
 * listing's CRM (if one is connected) and tries to send straight away.
 * Never throws, so it can't break the visitor's submission.
 */
export async function sendSubmissionToCrm(
  service: SupabaseClient,
  kind: CrmKind,
  sourceId: string,
  listing: { agent_id: string; agency_id: string | null },
): Promise<void> {
  try {
    const conn = await getConnectionForListing(service, listing);
    if (!conn) return;
    const { data: job, error } = await service
      .from("crm_sync_jobs")
      .insert({ connection_id: conn.id, kind, source_id: sourceId })
      .select("id")
      .single();
    if (error || !job) return; // Already queued.
    await processJob(service, (job as { id: string }).id);
  } catch (error) {
    console.error("CRM send failed:", error);
  }
}

/** For the scheduled retry job: sends whatever is due. */
export async function processDueJobs(service: SupabaseClient, limit = 25): Promise<Record<string, number>> {
  const { data } = await service
    .from("crm_sync_jobs")
    .select("id")
    .eq("status", "pending")
    .lte("next_attempt_at", new Date().toISOString())
    .order("next_attempt_at", { ascending: true })
    .limit(limit);
  const tally: Record<string, number> = {};
  for (const { id } of (data ?? []) as { id: string }[]) {
    const status = await processJob(service, id);
    tally[status] = (tally[status] ?? 0) + 1;
  }
  return tally;
}
