import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/rateLimit";
import { getAgencyAgents } from "@/lib/listingAlerts";
import { ValidationError, readJsonObject, uuid } from "@/lib/validate";

// Turns email and push alerts for one agency listing on or off for one agent
// in that agency. Any current agent in the listing's agency can choose who
// is alerted (themselves or a co-agent); all agency agents can already see
// and manage the listing itself.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!(await checkRateLimit("listing-alerts", user.id))) {
    return NextResponse.json(
      { error: "Too many changes. Please try again shortly." },
      { status: 429 },
    );
  }

  let listingId: string;
  let agentId: string;
  let enabled: boolean;
  try {
    const body = await readJsonObject(request);
    listingId = uuid(body.listingId, "listing");
    agentId = uuid(body.agentId, "agent");
    if (typeof body.enabled !== "boolean") throw new ValidationError("enabled");
    enabled = body.enabled;
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    throw error;
  }

  const service = createServiceClient();
  const { data: listing } = await service
    .from("listings")
    .select("id, agency_id")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing?.agency_id) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const agents = await getAgencyAgents(service, listing.agency_id as string);
  const ids = new Set(agents.map((a) => a.userId));
  if (!ids.has(user.id)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  if (!ids.has(agentId)) {
    return NextResponse.json({ error: "That agent isn't in this agency." }, { status: 400 });
  }

  const { error } = await service.from("listing_alert_agents").upsert(
    {
      listing_id: listingId,
      user_id: agentId,
      enabled,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "listing_id,user_id" },
  );

  if (error) {
    console.error("Listing alert update failed:", error.message);
    return NextResponse.json({ error: "Couldn't save. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, enabled });
}
