import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { AGENCY_MAX_SELF_SERVE_SEATS } from "@/lib/types";

// Changes how many licences the agency pays for.
//  - More licences: take effect now, charged pro rata for the rest of the
//    current billing period (nothing is charged during the free trial).
//  - Fewer licences: the agency has already paid for the current period, so
//    the lower number applies from the next billing cycle.
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const agencyId = String(body.agencyId ?? "");
  const target = Number(body.seats);

  if (!agencyId || !Number.isInteger(target) || target < 1) {
    return NextResponse.json({ error: "Choose a valid number of licences." }, { status: 400 });
  }

  if (target > AGENCY_MAX_SELF_SERVE_SEATS) {
    return NextResponse.json(
      { error: `For more than ${AGENCY_MAX_SELF_SERVE_SEATS} agents, please contact us for pricing.` },
      { status: 400 },
    );
  }

  const service = createServiceClient();

  const { data: agency } = await service
    .from("agencies")
    .select("id, owner_user_id, stripe_subscription_id, status, seats, pending_seats")
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

  const { count: activeCount } = await service
    .from("agency_members")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .eq("status", "active");

  if (target < (activeCount ?? 0)) {
    return NextResponse.json(
      { error: `You have ${activeCount} agents using licences. Remove some agents before reducing to ${target}.` },
      { status: 400 },
    );
  }

  const subscription = await stripe.subscriptions.retrieve(agency.stripe_subscription_id);
  const item = subscription.items.data[0];
  const trialing = subscription.status === "trialing";

  try {
    if (target > agency.seats) {
      // If a reduction was scheduled, put Stripe back at the licences already
      // paid for first, so only the genuine extra licences are charged.
      if (agency.pending_seats !== null && item.quantity !== agency.seats) {
        await stripe.subscriptionItems.update(item.id, {
          quantity: agency.seats,
          proration_behavior: "none",
        });
      }
      await stripe.subscriptionItems.update(item.id, {
        quantity: target,
        proration_behavior: "always_invoice",
        payment_behavior: "error_if_incomplete",
      });
      await service
        .from("agencies")
        .update({ seats: target, pending_seats: null, updated_at: new Date().toISOString() })
        .eq("id", agencyId);
      return NextResponse.json({ success: true, seats: target, pendingSeats: null });
    }

    if (target === agency.seats) {
      if (agency.pending_seats !== null) {
        await stripe.subscriptionItems.update(item.id, {
          quantity: agency.seats,
          proration_behavior: "none",
        });
        await service
          .from("agencies")
          .update({ pending_seats: null, updated_at: new Date().toISOString() })
          .eq("id", agencyId);
      }
      return NextResponse.json({ success: true, seats: target, pendingSeats: null });
    }

    // Reduction. Nothing has been paid yet during a trial, so apply it now.
    await stripe.subscriptionItems.update(item.id, {
      quantity: target,
      proration_behavior: "none",
    });
    if (trialing) {
      await service
        .from("agencies")
        .update({ seats: target, pending_seats: null, updated_at: new Date().toISOString() })
        .eq("id", agencyId);
      return NextResponse.json({ success: true, seats: target, pendingSeats: null });
    }
    await service
      .from("agencies")
      .update({ pending_seats: target, updated_at: new Date().toISOString() })
      .eq("id", agencyId);
    return NextResponse.json({ success: true, seats: agency.seats, pendingSeats: target });
  } catch (error) {
    console.error("Could not change agency licences:", error);
    const message =
      error instanceof Error ? error.message : "Could not update your licences. Please try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
