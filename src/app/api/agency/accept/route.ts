import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/rateLimit";
import { inviteCutoffIso } from "@/lib/agencyInvites";
import { ValidationError, bool, readJsonObject, uuid } from "@/lib/validate";

// The invited person's own answer to an agency invitation. Only the account
// the invitation was emailed to, with that email confirmed, can answer it.
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || !user.email || !user.emailConfirmed) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!(await checkRateLimit("agency-accept", user.id))) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  let memberId: string;
  let accept: boolean;
  try {
    const body = await readJsonObject(request);
    memberId = uuid(body.memberId, "invitation");
    accept = bool(body.accept);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    throw error;
  }

  const service = createServiceClient();

  const { data: invite } = await service
    .from("agency_members")
    .select("id, agency_id, email, status, invited_at")
    .eq("id", memberId)
    .maybeSingle();

  if (
    !invite ||
    invite.status !== "invited" ||
    invite.email.toLowerCase() !== user.email.toLowerCase() ||
    invite.invited_at < inviteCutoffIso()
  ) {
    return NextResponse.json({ error: "This invitation is no longer available." }, { status: 404 });
  }

  if (!accept) {
    await service
      .from("agency_members")
      .update({ status: "removed", removed_at: new Date().toISOString() })
      .eq("id", invite.id);
    return NextResponse.json({ success: true, accepted: false });
  }

  // A person can belong to only one agency at a time.
  const [{ data: ownsAgency }, { data: otherMembership }] = await Promise.all([
    service.from("agencies").select("id").eq("owner_user_id", user.id).maybeSingle(),
    service
      .from("agency_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .neq("agency_id", invite.agency_id)
      .maybeSingle(),
  ]);
  if (ownsAgency || otherMembership) {
    return NextResponse.json({ error: "You already belong to an agency." }, { status: 400 });
  }

  const { data: agency } = await service
    .from("agencies")
    .select("id, seats, status")
    .eq("id", invite.agency_id)
    .maybeSingle();

  if (!agency || (agency.status !== "active" && agency.status !== "trialing")) {
    return NextResponse.json({ error: "This agency isn't active right now." }, { status: 400 });
  }

  const { count: activeCount } = await service
    .from("agency_members")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agency.id)
    .eq("status", "active");
  if ((activeCount ?? 0) >= agency.seats) {
    return NextResponse.json(
      { error: "The agency has no free licence right now. Ask the owner to add one." },
      { status: 400 },
    );
  }

  // Accepting means the agency now pays, so end the person's own paid plan.
  const { data: ownSubscription } = await service
    .from("subscriptions")
    .select("stripe_subscription_id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    ownSubscription?.stripe_subscription_id &&
    (ownSubscription.status === "active" || ownSubscription.status === "trialing")
  ) {
    try {
      await stripe.subscriptions.cancel(ownSubscription.stripe_subscription_id);
    } catch (error) {
      console.error("Could not cancel individual subscription on invitation accept:", error);
    }
  }

  const { error } = await service
    .from("agency_members")
    .update({
      status: "active",
      user_id: user.id,
      joined_at: new Date().toISOString(),
      removed_at: null,
    })
    .eq("id", invite.id);

  if (error) {
    console.error("Agency invitation accept failed:", error.message);
    return NextResponse.json({ error: "Could not join the agency. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true, accepted: true });
}
