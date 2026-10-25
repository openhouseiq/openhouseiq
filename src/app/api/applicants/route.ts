import { NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { notifyAgentOfSubmission } from "@/lib/notify";
import { siteOrigin } from "@/lib/siteUrl";
import {
  ValidationError,
  bool,
  email,
  integer,
  isoDate,
  oneOf,
  readJsonObject,
  requiredText,
  text,
  uuid,
} from "@/lib/validate";

const INCOME_RANGES = ["under_50k", "50k_75k", "75k_100k", "100k_150k", "150k_plus"] as const;
const LEASE_TERMS = ["month_to_month", "6_months", "12_months", "24_months"] as const;

export async function POST(request: Request) {
  // Retired 25 Oct 2026: the old free-form rental application asked for things
  // the Queensland and Victorian forms do not allow (smoking, free-text notes).
  // New applications go to /api/rental-applications, which uses each state's form.
  if (process.env.LEGACY_APPLICANTS_ENABLED !== "true") {
    return NextResponse.json(
      { error: "This form is no longer available. Please use the link from the agent again." },
      { status: 410 },
    );
  }
  const ip = clientIp(request);
  if (!(await checkRateLimit("applicants", ip))) {
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
    const adults = integer(body.numberOfAdults, "adults", 1, 50);
    const children = integer(body.numberOfChildren, "children", 0, 50);
    const occupants = integer(body.numberOfOccupants, "occupants", 1, 100);
    if (adults !== null && children !== null && occupants !== null && occupants !== adults + children) {
      throw new ValidationError("Invalid occupants");
    }
    row = {
      listing_id: listingId,
      name: requiredText(body.name, "name", 120),
      email: email(body.email),
      phone: text(body.phone, "phone", 40),
      employer: text(body.employer, "employer", 200),
      occupation: text(body.occupation, "occupation", 200),
      income_range: oneOf(body.incomeRange, INCOME_RANGES, "income"),
      can_provide_proof_of_income: bool(body.canProvideProofOfIncome),
      desired_move_in_date: isoDate(body.desiredMoveInDate, "move-in date"),
      desired_lease_term: oneOf(body.desiredLeaseTerm, LEASE_TERMS, "lease term"),
      has_pets: bool(body.hasPets),
      pet_details: text(body.petDetails, "pet details", 1000),
      number_of_occupants: occupants,
      number_of_adults: adults,
      number_of_children: children,
      is_smoker: bool(body.isSmoker),
      reference_name: text(body.referenceName, "reference", 120),
      reference_phone: text(body.referencePhone, "reference phone", 40),
      reference_relationship: text(body.referenceRelationship, "reference relationship", 120),
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

  if (!(await checkRateLimit("applicants-listing", listingId))) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again shortly." },
      { status: 429 },
    );
  }

  const supabase = createServiceClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("agent_id, agent_email, address")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const { error } = await supabase.from("applicants").insert(row);

  if (error) {
    console.error("Applicant insert failed:", error.message);
    return NextResponse.json(
      { error: "Could not save your application. Please try again." },
      { status: 500 },
    );
  }

  await notifyAgentOfSubmission({
    agentId: listing.agent_id,
    agentEmail: listing.agent_email,
    kind: "applicant",
    listingAddress: listing.address,
    listingId,
    baseUrl: siteOrigin(request),
  });

  return NextResponse.json({ success: true });
}
