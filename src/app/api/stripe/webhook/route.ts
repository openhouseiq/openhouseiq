import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { checkInfrastructureCheckpoint } from "@/lib/infraCheckpoints";
import { applyPendingReferralCredits, processReferralInvoice } from "@/lib/referrals";

type Db = ReturnType<typeof createServiceClient>;

/** Throws when a database write failed, so the webhook answers with an error and Stripe retries. */
function check(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
}

async function processEvent(event: Stripe.Event, supabase: Db) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );

        if (subscription.metadata?.type === "agency") {
          const agencyId = subscription.metadata.agency_id;
          if (agencyId) {
            check(await supabase
              .from("agencies")
              .update({
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: subscription.id,
                status: subscription.status,
                price_id: subscription.items.data[0]?.price.id ?? null,
                seats: subscription.items.data[0]?.quantity ?? 1,
                trial_ends_at: subscription.trial_end
                  ? new Date(subscription.trial_end * 1000).toISOString()
                  : null,
                current_period_end: new Date(
                  subscription.items.data[0].current_period_end * 1000,
                ).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", agencyId));

            const { data: ownerRow } = await supabase
              .from("agencies")
              .select("owner_user_id")
              .eq("id", agencyId)
              .maybeSingle();
            if (ownerRow) {
              await applyPendingReferralCredits(supabase, ownerRow.owner_user_id).catch(() => {});
            }

            // The owner is now covered by the agency plan, so end any solo
            // subscription of theirs rather than billing them twice.
            const { data: agency } = await supabase
              .from("agencies")
              .select("owner_user_id")
              .eq("id", agencyId)
              .maybeSingle();
            if (agency) {
              const { data: ownSub } = await supabase
                .from("subscriptions")
                .select("stripe_subscription_id, status")
                .eq("user_id", agency.owner_user_id)
                .maybeSingle();
              if (
                ownSub?.stripe_subscription_id &&
                (ownSub.status === "active" || ownSub.status === "trialing")
              ) {
                try {
                  await stripe.subscriptions.cancel(ownSub.stripe_subscription_id);
                } catch (error) {
                  console.error("Could not cancel owner's solo subscription:", error);
                }
              }
            }

            await checkInfrastructureCheckpoint();
          }
          break;
        }

        const userId = session.client_reference_id;
        if (userId) {
          check(await supabase
            .from("subscriptions")
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              status: subscription.status,
              price_id: subscription.items.data[0]?.price.id ?? null,
              trial_ends_at: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
              current_period_end: new Date(
                subscription.items.data[0].current_period_end * 1000,
              ).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId));

          await applyPendingReferralCredits(supabase, userId).catch(() => {});
          await checkInfrastructureCheckpoint();
        }
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      if (subscription.metadata?.type === "agency") {
        const agencyId = subscription.metadata.agency_id;
        if (agencyId) {
          const newPeriodEnd = new Date(subscription.items.data[0].current_period_end * 1000);

          // A scheduled licence reduction takes effect once the agency has
          // rolled into its next billing period.
          const { data: current } = await supabase
            .from("agencies")
            .select("pending_seats, current_period_end")
            .eq("id", agencyId)
            .eq("stripe_subscription_id", subscription.id)
            .maybeSingle();
          const renewed =
            current?.current_period_end &&
            newPeriodEnd.getTime() > new Date(current.current_period_end).getTime();
          const applyPending = Boolean(renewed) && current?.pending_seats != null;

          check(await supabase
            .from("agencies")
            .update({
              status: subscription.status,
              price_id: subscription.items.data[0]?.price.id ?? null,
              trial_ends_at: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
              current_period_end: newPeriodEnd.toISOString(),
              ...(applyPending ? { seats: current!.pending_seats, pending_seats: null } : {}),
              updated_at: new Date().toISOString(),
            })
            .eq("id", agencyId)
            .eq("stripe_subscription_id", subscription.id));
        }
        break;
      }

      const userId = subscription.metadata?.supabase_user_id;

      const update = {
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        price_id: subscription.items.data[0]?.price.id ?? null,
        trial_ends_at: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null,
        current_period_end: new Date(
          subscription.items.data[0].current_period_end * 1000,
        ).toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Only apply this event if the row is still tracking this specific
      // subscription — an update/cancellation on a superseded subscription
      // (e.g. an old plan replaced by a newer checkout) must never clobber
      // the row's current one.
      if (userId) {
        check(await supabase
          .from("subscriptions")
          .update(update)
          .eq("user_id", userId)
          .eq("stripe_subscription_id", subscription.id));
      } else {
        check(await supabase
          .from("subscriptions")
          .update(update)
          .eq("stripe_customer_id", subscription.customer as string)
          .eq("stripe_subscription_id", subscription.id));
      }
      break;
    }

    case "invoice.paid": {
      // Every paid invoice may earn the referrer of this account a credit.
      try {
        await processReferralInvoice(supabase, event.data.object as Stripe.Invoice);
      } catch (error) {
        console.error("Referral processing failed:", error);
      }
      break;
    }

    default:
      break;
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await request.text();

  if (!signature || !secret) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Stripe can deliver the same event more than once. Record each event id
  // first; a repeat hits the unique key and is acknowledged without being
  // processed again. If the table doesn't exist yet we carry on without it.
  const { error: dedupeError } = await supabase
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });

  if (dedupeError?.code === "23505") {
    return NextResponse.json({ received: true, duplicate: true });
  }
  const dedupeActive = !dedupeError;
  if (dedupeError) {
    console.error("Stripe event de-duplication unavailable:", dedupeError.message);
  }

  try {
    await processEvent(event, supabase);
  } catch (error) {
    console.error(`Stripe event ${event.type} failed:`, error);
    // Release the event so Stripe's retry is processed rather than skipped.
    if (dedupeActive) {
      await supabase.from("stripe_events").delete().eq("id", event.id);
    }
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
