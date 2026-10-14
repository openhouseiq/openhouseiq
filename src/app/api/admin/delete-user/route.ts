import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/service";

// Deletion is only ever allowed for accounts that never became a real
// customer. Anyone trialing or actively paying is refused server-side,
// regardless of what the client sends.
const PROTECTED_STATUSES = new Set(["active", "trialing"]);

export async function POST(request: Request) {
  const user = await getAdminUser();

  if (!user) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const body = await request.json();
  const targetUserId = String(body.userId ?? "");

  if (!targetUserId) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: subscription } = await service
    .from("subscriptions")
    .select("status")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (subscription && PROTECTED_STATUSES.has(subscription.status)) {
    return NextResponse.json(
      { error: "This agent is on trial or has an active subscription and can't be deleted." },
      { status: 400 },
    );
  }

  if (subscription) {
    await service.from("subscriptions").delete().eq("user_id", targetUserId);
  }

  const { error } = await service.auth.admin.deleteUser(targetUserId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
