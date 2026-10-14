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
  oneOf,
  readJsonObject,
  requiredText,
  text,
  uuid,
} from "@/lib/validate";

const INTEREST_LEVELS = ["not_interested", "considering", "very_interested", "ready_to_offer"] as const;
const TIMEFRAMES = [
  "immediately",
  "one_to_three_months",
  "three_to_six_months",
  "six_plus_months",
  "just_browsing",
] as const;

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!(await checkRateLimit("feedback", ip))) {
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
    const isAnonymous = bool(body.isAnonymous);
    row = {
      listing_id: listingId,
      is_anonymous: isAnonymous,
      name: isAnonymous ? null : requiredText(body.name, "name", 120),
      email: isAnonymous ? null : email(body.email),
      phone: isAnonymous ? null : text(body.phone, "phone", 40),
      comments: text(body.comments, "comments", 4000),
      interest_level: oneOf(body.interestLevel, INTEREST_LEVELS, "interest"),
      rating_price: integer(body.ratingPrice, "rating", 1, 5),
      rating_condition: integer(body.ratingCondition, "rating", 1, 5),
      rating_location: integer(body.ratingLocation, "rating", 1, 5),
      rating_layout: integer(body.ratingLayout, "rating", 1, 5),
      pre_approved: bool(body.preApproved),
      working_with_agent: bool(body.workingWithAgent),
      purchase_timeframe: oneOf(body.purchaseTimeframe, TIMEFRAMES, "timeframe"),
      wants_followup: bool(body.wantsFollowup),
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

  if (!(await checkRateLimit("feedback-listing", listingId))) {
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

  const { error } = await supabase.from("feedback").insert(row);

  if (error) {
    console.error("Feedback insert failed:", error.message);
    return NextResponse.json(
      { error: "Could not save your feedback. Please try again." },
      { status: 500 },
    );
  }

  await notifyAgentOfSubmission({
    agentId: listing.agent_id,
    agentEmail: listing.agent_email,
    kind: "feedback",
    listingAddress: listing.address,
    listingId,
    baseUrl: siteOrigin(request),
  });

  return NextResponse.json({ success: true });
}
