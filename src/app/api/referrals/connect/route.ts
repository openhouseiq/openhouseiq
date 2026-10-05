import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { createPayoutOnboardingLink } from "@/lib/referrals";

// Sends a referrer to Stripe to set up (or finish setting up) cash payouts.
export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  try {
    const url = await createPayoutOnboardingLink(createServiceClient(), user, origin);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Could not start payout setup:", error);
    const message = error instanceof Error ? error.message : "Could not start payout setup.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
