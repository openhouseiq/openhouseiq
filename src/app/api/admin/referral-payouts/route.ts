import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { runReferralPayouts } from "@/lib/referrals";

// Admin only. dryRun: true reports what would be paid without moving money.
export async function POST(request: Request) {
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await request.json();
  const results = await runReferralPayouts(createServiceClient(), { dryRun: body.dryRun !== false });
  return NextResponse.json({ results });
}
