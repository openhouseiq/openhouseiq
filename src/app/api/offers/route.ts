import { NextResponse, after } from "next/server";
import { sendSubmissionToCrm } from "@/lib/crm";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { notifyAgentOfSubmission } from "@/lib/notify";
import { siteOrigin } from "@/lib/siteUrl";
import { sendVisitorThankYou } from "@/lib/visitorThankYou";
import {
  ValidationError,
  bool,
  email,
  oneOf,
  positiveAmount,
  readJsonObject,
  requiredText,
  text,
  uuid,
} from "@/lib/validate";

const FINANCING_TYPES = ["cash", "pre_approved", "financing"] as const;
const SETTLEMENT_TERMS = ["asap", "30_days", "45_days", "60_days", "90_plus_days", "flexible"] as const;

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!(await checkRateLimit("offers", ip))) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again shortly." },
      { status: 429 },
    );
  }

  let row;
  let listingId: string;
  let turnstileToken: string;
  try {
    const body = await readJsonObject(request);
    turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
    listingId = uuid(body.listingId, "listing");
    row = {
      listing_id: listingId,
      name: requiredText(body.name, "name", 120),
      email: email(body.email),
      phone: text(body.phone, "phone", 40),
      offer_amount: positiveAmount(body.offerAmount, "offer"),
      financing_type: oneOf(body.financingType, FINANCING_TYPES, "financing"),
      settlement_term: oneOf(body.settlementTerm, SETTLEMENT_TERMS, "settlement"),
      waive_inspection: bool(body.waiveInspection),
      notes: text(body.notes, "notes", 4000),
    };
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: "Please check the form and try again." },
        { status: 400 },
      );
    }
    throw error;
  }

  if (!(await verifyTurnstileToken(turnstileToken, ip))) {
    return NextResponse.json(
      { error: "CAPTCHA verification failed. Please try again." },
      { status: 400 },
    );
  }

  if (!(await checkRateLimit("offers-listing", listingId))) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again shortly." },
      { status: 429 },
    );
  }

  const supabase = createServiceClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("agent_id, agency_id, agent_email, agent_name, address")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const { data: saved, error } = await supabase.from("offers").insert(row).select("id").single();

  if (error) {
    console.error("Offer insert failed:", error.message);
    return NextResponse.json(
      { error: "Could not save your offer. Please try again." },
      { status: 500 },
    );
  }

  // Tell the agent (push + email) after replying, so the visitor isn't kept
  // waiting on "Sending…" while notifications go out.
  const baseUrl = siteOrigin(request);
  after(() =>
    notifyAgentOfSubmission({
      agentId: listing.agent_id,
      agentEmail: listing.agent_email,
      kind: "offer",
      listingAddress: listing.address,
      listingId,
      baseUrl,
    }).catch((error) => console.error("Agent notification failed:", error)),
  );

  // Confirm to the buyer by email on the agent's behalf (unless the agent has
  // turned this off), after replying.
  const visitor = { name: row.name, email: row.email };
  after(() =>
    sendVisitorThankYou({
      kind: "offer",
      agentId: listing.agent_id,
      listingAgentName: listing.agent_name,
      listingAgentEmail: listing.agent_email,
      listingAddress: listing.address,
      visitor,
    }).catch((error) => console.error("Visitor thank-you failed:", error)),
  );

  // Send to the agency's CRM (if connected) after replying, so the visitor
  // never waits on it.
  if (saved?.id) {
    const savedId = saved.id as string;
    after(() => sendSubmissionToCrm(supabase, "offer", savedId, listing));
  }

  return NextResponse.json({ success: true });
}
