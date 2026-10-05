import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { runReferralPayouts } from "@/lib/referrals";

function isAdmin(email: string | null | undefined): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email && adminEmails.includes(email.toLowerCase()));
}

// Admin only. dryRun: true reports what would be paid without moving money.
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await request.json();
  const results = await runReferralPayouts(createServiceClient(), { dryRun: body.dryRun !== false });
  return NextResponse.json({ results });
}
