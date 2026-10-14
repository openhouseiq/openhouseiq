import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await request.json();
  const targetUserId = String(body.userId ?? "");
  const days = Number(body.days);

  if (!targetUserId || !Number.isFinite(days) || days <= 0) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const service = createServiceClient();
  const newTrialEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await service
    .from("subscriptions")
    .update({
      status: "trialing",
      trial_ends_at: newTrialEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", targetUserId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, trialEndsAt: newTrialEnd });
}
