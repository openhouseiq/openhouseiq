import { NextResponse } from "next/server";
import { siteOrigin } from "@/lib/siteUrl";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { createPayoutOnboardingLink } from "@/lib/referrals";

// Sends a referrer to Stripe to set up (or finish setting up) cash payouts.
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const origin = siteOrigin(request);

  try {
    const url = await createPayoutOnboardingLink(createServiceClient(), user, origin);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Could not start payout setup:", error);
    const message = "Could not start payout setup.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
