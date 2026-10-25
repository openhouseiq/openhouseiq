import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { checkRateLimit } from "@/lib/rateLimit";
import { ValidationError, isoDate, readJsonObject, uuid } from "@/lib/validate";
import { getRentalForm } from "@/lib/rentalForms";
import { cleanAgentConfig } from "@/lib/rentalForms/answers";

// Saves an agent's rental settings for one listing: the items the state's form
// says the agent completes, the landlord settings used for ranking, and the
// date the property was leased (which starts the data-retention clock).

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!(await checkRateLimit("rental-settings", user.id))) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  let listingId: string;
  let state: string;
  let config: Record<string, unknown>;
  let ranking: { maxRentShare: number | null; preferredMoveIn: string | null };
  let leasedOn: string | null;
  try {
    const body = await readJsonObject(request);
    listingId = uuid(body.listingId, "listing");
    state = typeof body.state === "string" ? body.state : "";
    if (typeof body.config !== "object" || body.config === null || Array.isArray(body.config)) {
      throw new ValidationError("Invalid config");
    }
    config = body.config as Record<string, unknown>;
    const r = (typeof body.ranking === "object" && body.ranking !== null ? body.ranking : {}) as Record<string, unknown>;
    const share = r.maxRentShare === null || r.maxRentShare === undefined || r.maxRentShare === "" ? null : Number(r.maxRentShare);
    if (share !== null && !(Number.isFinite(share) && share >= 0.1 && share <= 0.6)) {
      throw new ValidationError("Invalid rent share");
    }
    ranking = { maxRentShare: share, preferredMoveIn: isoDate(r.preferredMoveIn, "move-in date") };
    leasedOn = isoDate(body.leasedOn, "leased date");
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: "Please check the settings and try again." }, { status: 400 });
    }
    throw error;
  }

  const form = getRentalForm(state);
  if (!form) {
    return NextResponse.json({ error: "That state is not available yet." }, { status: 400 });
  }

  let clean;
  try {
    clean = cleanAgentConfig(form, config);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: "Please complete the required items.", field: error.message.replace("Invalid ", "") },
        { status: 400 },
      );
    }
    throw error;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .update({
      state: form.state,
      rental_config: { ...clean, ranking },
      leased_on: leasedOn,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("listing_type", "rental")
    .select("id");

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: "Could not save the settings." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
