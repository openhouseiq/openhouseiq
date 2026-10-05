import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { runReferralPayouts } from "@/lib/referrals";

// For a monthly scheduled job. Protected by a shared secret rather than a
// login; it does nothing unless REFERRAL_PAYOUT_SECRET is set and matches.
export async function POST(request: Request) {
  const secret = process.env.REFERRAL_PAYOUT_SECRET;
  if (!secret || request.headers.get("x-payout-secret") !== secret) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const results = await runReferralPayouts(createServiceClient(), { dryRun: false });
  return NextResponse.json({ results });
}
