import { NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { notifyAgentOfSubmission } from "@/lib/notify";

export async function POST(request: Request) {
  const allowed = await checkRateLimit("applicants", clientIp(request));
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

  const supabase = createServiceClient();
  const { error } = await supabase.from("applicants").insert({
    listing_id: body.listingId,
    name: body.name,
    email: body.email,
    phone: body.phone || null,
    employer: body.employer || null,
    occupation: body.occupation || null,
    income_range: body.incomeRange || null,
    can_provide_proof_of_income: Boolean(body.canProvideProofOfIncome),
    desired_move_in_date: body.desiredMoveInDate || null,
    desired_lease_term: body.desiredLeaseTerm || null,
    has_pets: Boolean(body.hasPets),
    pet_details: body.petDetails || null,
    number_of_occupants: body.numberOfOccupants || null,
    number_of_adults: body.numberOfAdults || null,
    number_of_children: body.numberOfChildren ?? null,
    is_smoker: Boolean(body.isSmoker),
    reference_name: body.referenceName || null,
    reference_phone: body.referencePhone || null,
    reference_relationship: body.referenceRelationship || null,
    notes: body.notes || null,
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
      kind: "applicant",
      listingAddress: listing.address,
      listingId: body.listingId,
      baseUrl: `${protocol}://${host}`,
    });
  }

  return NextResponse.json({ success: true });
}
