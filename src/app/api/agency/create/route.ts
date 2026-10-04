import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { AGENCY_MAX_SELF_SERVE_SEATS } from "@/lib/types";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const plan = body.plan === "yearly" ? "yearly" : "monthly";
  const seats = Number(body.seats);

  if (!name) {
    return NextResponse.json({ error: "Agency name is required." }, { status: 400 });
  }

  if (!Number.isInteger(seats) || seats < 1) {
    return NextResponse.json({ error: "Choose how many agents you need." }, { status: 400 });
  }

  if (seats > AGENCY_MAX_SELF_SERVE_SEATS) {
    return NextResponse.json(
      { error: `For more than ${AGENCY_MAX_SELF_SERVE_SEATS} agents, please contact us for pricing.` },
      { status: 400 },
    );
  }

  const service = createServiceClient();

  const { data: existingOwned } = await service
    .from("agencies")
    .select("id, status, stripe_subscription_id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  // An agency left "incomplete" means checkout was abandoned — let the owner
  // retry it rather than getting stuck.
  const resumable =
    existingOwned && existingOwned.status === "incomplete" && !existingOwned.stripe_subscription_id
      ? existingOwned
      : null;

  if (existingOwned && !resumable) {
    return NextResponse.json(
      { error: "You already own an agency. Manage it from the agency dashboard." },
      { status: 400 },
    );
  }

  const { data: existingMembership } = await service
    .from("agency_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (existingMembership) {
    return NextResponse.json(
      { error: "You're already a member of an agency." },
      { status: 400 },
    );
  }

  const priceId =
    plan === "yearly" ? process.env.STRIPE_PRICE_AGENCY_YEARLY! : process.env.STRIPE_PRICE_AGENCY_MONTHLY!;

  const billingInterval = plan === "yearly" ? "year" : "month";

  const { data: agency, error: insertError } = resumable
    ? await service
        .from("agencies")
        .update({ name, billing_interval: billingInterval, seats })
        .eq("id", resumable.id)
        .select()
        .single()
    : await service
        .from("agencies")
        .insert({
          name,
          owner_user_id: user.id,
          billing_interval: billingInterval,
          seats,
          status: "incomplete",
        })
        .select()
        .single();

  if (insertError || !agency) {
    return NextResponse.json(
      { error: insertError?.message ?? "Could not create agency." },
      { status: 400 },
    );
  }

  if (!resumable) {
    await service.from("agency_members").insert({
      agency_id: agency.id,
      user_id: user.id,
      email: user.email,
      status: "active",
      joined_at: new Date().toISOString(),
    });
  }

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      client_reference_id: agency.id,
      line_items: [{ price: priceId, quantity: seats }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { type: "agency", agency_id: agency.id },
      },
      payment_method_collection: "always",
      managed_payments: { enabled: false },
      success_url: `${origin}/dashboard/agency?billing=success`,
      cancel_url: `${origin}/dashboard/agency?billing=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    // Roll back a newly created agency row so a failed checkout doesn't leave
    // an orphan behind. A resumed one stays so the owner can retry.
    if (!resumable) {
      await service.from("agency_members").delete().eq("agency_id", agency.id);
      await service.from("agencies").delete().eq("id", agency.id);
    }
    console.error("Agency Stripe checkout session creation failed:", error);
    const message = error instanceof Error ? error.message : "Could not start checkout.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
