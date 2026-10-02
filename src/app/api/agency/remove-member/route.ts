import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const memberId = String(body.memberId ?? "");

  const service = createServiceClient();

  const { data: member } = await service
    .from("agency_members")
    .select("id, agency_id, status, user_id")
    .eq("id", memberId)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const { data: agency } = await service
    .from("agencies")
    .select("id, owner_user_id, stripe_subscription_id")
    .eq("id", member.agency_id)
    .maybeSingle();

  if (!agency || agency.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  if (member.user_id === agency.owner_user_id) {
    return NextResponse.json({ error: "The agency owner can't be removed." }, { status: 400 });
  }

  const wasActive = member.status === "active";

  await service
    .from("agency_members")
    .update({ status: "removed", removed_at: new Date().toISOString() })
    .eq("id", memberId);

  if (wasActive && agency.stripe_subscription_id) {
    try {
      const subscription = await stripe.subscriptions.retrieve(agency.stripe_subscription_id);
      const item = subscription.items.data[0];
      const newQuantity = Math.max(1, (item.quantity ?? 1) - 1);
      await stripe.subscriptionItems.update(item.id, { quantity: newQuantity });
    } catch (error) {
      console.error("Could not update agency seat quantity on removal:", error);
    }
  }

  return NextResponse.json({ success: true });
}
