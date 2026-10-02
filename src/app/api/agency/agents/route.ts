import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";

function generateTempPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 16);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const agencyId = String(body.agencyId ?? "");
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!agencyId || !name || !email || !email.includes("@")) {
    return NextResponse.json({ error: "A name and valid email are required." }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: agency } = await service
    .from("agencies")
    .select("id, owner_user_id, stripe_subscription_id")
    .eq("id", agencyId)
    .maybeSingle();

  if (!agency || agency.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  if (!agency.stripe_subscription_id) {
    return NextResponse.json(
      { error: "This agency's subscription isn't set up yet. Try again shortly." },
      { status: 400 },
    );
  }

  const { data: existingMember } = await service
    .from("agency_members")
    .select("id, status")
    .eq("agency_id", agencyId)
    .eq("email", email)
    .maybeSingle();

  if (existingMember && existingMember.status === "active") {
    return NextResponse.json({ error: "Already a member." }, { status: 400 });
  }

  // Look up whether this email already belongs to an OpenHouseIQ account.
  let existingUserId: string | null = null;
  let page = 1;
  while (!existingUserId) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) existingUserId = match.id;
    if (match || data.users.length < 200) break;
    page += 1;
  }

  let tempPassword: string | null = null;

  if (existingUserId) {
    // Already has an account — if it has its own paid subscription, cancel
    // it; they're now covered by the agency's seat instead.
    const { data: ownSubscription } = await service
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", existingUserId)
      .maybeSingle();

    if (
      ownSubscription?.stripe_subscription_id &&
      (ownSubscription.status === "active" || ownSubscription.status === "trialing")
    ) {
      try {
        await stripe.subscriptions.cancel(ownSubscription.stripe_subscription_id);
      } catch (error) {
        console.error("Could not cancel individual subscription on agency add:", error);
      }
    }
  } else {
    tempPassword = generateTempPassword();
    const { data: created, error: createError } = await service.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (createError || !created.user) {
      return NextResponse.json(
        { error: createError?.message ?? "Could not create the agent's account." },
        { status: 400 },
      );
    }

    existingUserId = created.user.id;
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

  const memberData = {
    agency_id: agencyId,
    user_id: existingUserId,
    email,
    status: "active" as const,
    joined_at: new Date().toISOString(),
  };

  let memberId: string;
  if (existingMember) {
    await service.from("agency_members").update(memberData).eq("id", existingMember.id);
    memberId = existingMember.id;
  } else {
    const { data: inserted, error: insertError } = await service
      .from("agency_members")
      .insert(memberData)
      .select("id")
      .single();
    if (insertError || !inserted) {
      return NextResponse.json(
        { error: insertError?.message ?? "Could not add the agent." },
        { status: 400 },
      );
    }
    memberId = inserted.id;
  }

  return NextResponse.json({ success: true, memberId, email, tempPassword });
}
