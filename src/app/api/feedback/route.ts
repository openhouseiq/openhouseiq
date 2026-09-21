import { NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { notifyAgentOfSubmission } from "@/lib/notify";

export async function POST(request: Request) {
  const allowed = await checkRateLimit("feedback", clientIp(request));
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again shortly." },
      { status: 429 },
    );
  }

  const body = await request.json();

  const verified = await verifyTurnstileToken(String(body.turnstileToken ?? ""));
  if (!verified) {
    return NextResponse.json(
      { error: "CAPTCHA verification failed. Please try again." },
      { status: 400 },
    );
  }

  const isAnonymous = Boolean(body.isAnonymous);
  const supabase = createServiceClient();
  const { error } = await supabase.from("feedback").insert({
    listing_id: body.listingId,
    is_anonymous: isAnonymous,
    name: isAnonymous ? null : body.name || null,
    email: isAnonymous ? null : body.email || null,
    phone: isAnonymous ? null : body.phone || null,
    comments: body.comments || null,
    interest_level: body.interestLevel || null,
    rating_price: body.ratingPrice || null,
    rating_condition: body.ratingCondition || null,
    rating_location: body.ratingLocation || null,
    rating_layout: body.ratingLayout || null,
    pre_approved: Boolean(body.preApproved),
    working_with_agent: Boolean(body.workingWithAgent),
    purchase_timeframe: body.purchaseTimeframe || null,
    wants_followup: Boolean(body.wantsFollowup),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("agent_id, agent_email, address")
    .eq("id", body.listingId)
    .maybeSingle();

  if (listing) {
    const host = request.headers.get("host");
    const protocol = host?.startsWith("localhost") ? "http" : "https";
    await notifyAgentOfSubmission({
      agentId: listing.agent_id,
      agentEmail: listing.agent_email,
      kind: "feedback",
      listingAddress: listing.address,
      listingId: body.listingId,
      baseUrl: `${protocol}://${host}`,
    });
  }

  return NextResponse.json({ success: true });
}
