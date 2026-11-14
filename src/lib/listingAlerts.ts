import type { SupabaseClient } from "@supabase/supabase-js";
import { notifyAgentOfSubmission } from "@/lib/notify";

type NotifyKind = "offer" | "feedback" | "applicant";

export type AlertListing = {
  id: string;
  agent_id: string;
  agency_id?: string | null;
  agent_email: string | null;
  address: string;
};

export type AgencyAgent = {
  userId: string;
  name: string;
  email: string | null;
};

/** Every current agent in an agency: the owner plus active members. */
export async function getAgencyAgents(
  service: SupabaseClient,
  agencyId: string,
): Promise<AgencyAgent[]> {
  const [{ data: agency }, { data: members }] = await Promise.all([
    service.from("agencies").select("owner_user_id").eq("id", agencyId).maybeSingle(),
    service
      .from("agency_members")
      .select("user_id, email")
      .eq("agency_id", agencyId)
      .eq("status", "active"),
  ]);

  const ids = new Set<string>();
  if (agency?.owner_user_id) ids.add(agency.owner_user_id as string);
  for (const m of members ?? []) {
    if (m.user_id) ids.add(m.user_id as string);
  }

  const agents = await Promise.all(
    [...ids].map(async (userId) => {
      const { data } = await service.auth.admin.getUserById(userId);
      const email = data.user?.email ?? null;
      const name =
        (data.user?.user_metadata?.full_name as string | undefined)?.trim() ||
        email ||
        "Agent";
      return { userId, name, email };
    }),
  );

  return agents.sort((a, b) => a.name.localeCompare(b.name));
}

/** Saved on/off choices for one listing, keyed by agent user id. */
export async function getListingAlertChoices(
  service: SupabaseClient,
  listingId: string,
): Promise<Map<string, boolean>> {
  const { data } = await service
    .from("listing_alert_agents")
    .select("user_id, enabled")
    .eq("listing_id", listingId);
  return new Map((data ?? []).map((r) => [r.user_id as string, r.enabled as boolean]));
}

/** Whether an agent gets alerts for a listing: their saved choice, or on by default for the creator. */
export function alertsOn(
  choices: Map<string, boolean>,
  userId: string,
  creatorId: string,
): boolean {
  return choices.get(userId) ?? userId === creatorId;
}

/**
 * Sends a new-submission alert to every agent who gets alerts for this
 * listing. Listings outside an agency alert the creating agent, as before.
 * If nobody in the agency has alerts on (for example the creator left),
 * the agency owner is alerted so a submission is never missed.
 */
export async function notifyListingAgents(
  service: SupabaseClient,
  {
    listing,
    kind,
    baseUrl,
  }: { listing: AlertListing; kind: NotifyKind; baseUrl: string },
): Promise<void> {
  const send = (agentId: string, agentEmail: string | null) =>
    notifyAgentOfSubmission({
      agentId,
      agentEmail,
      kind,
      listingAddress: listing.address,
      listingId: listing.id,
      baseUrl,
    });

  if (!listing.agency_id) {
    await send(listing.agent_id, listing.agent_email);
    return;
  }

  const [agents, choices, { data: agency }] = await Promise.all([
    getAgencyAgents(service, listing.agency_id),
    getListingAlertChoices(service, listing.id),
    service.from("agencies").select("owner_user_id").eq("id", listing.agency_id).maybeSingle(),
  ]);

  let recipients = agents.filter((a) => alertsOn(choices, a.userId, listing.agent_id));
  if (recipients.length === 0) {
    recipients = agents.filter((a) => a.userId === agency?.owner_user_id);
  }

  const results = await Promise.allSettled(
    recipients.map((a) =>
      send(a.userId, a.userId === listing.agent_id ? (listing.agent_email ?? a.email) : a.email),
    ),
  );
  for (const r of results) {
    if (r.status === "rejected") console.error("Agent notification failed:", r.reason);
  }
}
