import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const agencyId = String(body.agencyId ?? "");

  const service = createServiceClient();

  const { data: invite } = await service
    .from("agency_members")
    .select("id, agency_id")
    .eq("agency_id", agencyId)
    .eq("email", user.email.toLowerCase())
    .eq("status", "invited")
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({ error: "No pending invite found." }, { status: 404 });
  }

  const { data: agency } = await service
    .from("agencies")
    .select("id, stripe_subscription_id")
    .eq("id", invite.agency_id)
    .maybeSingle();

  if (!agency?.stripe_subscription_id) {
    return NextResponse.json(
      { error: "This agency's subscription isn't set up yet. Try again shortly." },
      { status: 400 },
    );
  }

  // If this agent already has their own individual subscription, cancel it —
  // they're now covered by the agency's seat instead, and shouldn't be
  // billed twice.
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
      console.error("Could not cancel individual subscription on agency join:", error);
    }
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(agency.stripe_subscription_id);
    const item = subscription.items.data[0];
    const newQuantity = (item.quantity ?? 1) + 1;
    await stripe.subscriptionItems.update(item.id, { quantity: newQuantity });
  } catch (error) {
    console.error("Could not update agency seat quantity:", error);
    return NextResponse.json({ error: "Could not update the agency's billing. Try again." }, { status: 500 });
  }

  await service
    .from("agency_members")
    .update({ status: "active", user_id: user.id, joined_at: new Date().toISOString() })
    .eq("id", invite.id);

  return NextResponse.json({ success: true });
}
