import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { sendNotificationEmail } from "@/lib/notificationEmail";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const agencyId = String(body.agencyId ?? "");
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!agencyId || !email || !email.includes("@")) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  const service = createServiceClient();

  const { data: agency } = await service
    .from("agencies")
    .select("id, name, owner_user_id")
    .eq("id", agencyId)
    .maybeSingle();

  if (!agency || agency.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { data: existing } = await service
    .from("agency_members")
    .select("id, status")
    .eq("agency_id", agencyId)
    .eq("email", email)
    .maybeSingle();

  if (existing && existing.status !== "removed") {
    return NextResponse.json(
      { error: existing.status === "active" ? "Already a member." : "Already invited." },
      { status: 400 },
    );
  }

  let memberId = existing?.id ?? null;

  if (existing && existing.status === "removed") {
    await service
      .from("agency_members")
      .update({ status: "invited", invited_at: new Date().toISOString(), removed_at: null })
      .eq("id", existing.id);
  } else {
    const { data: inserted } = await service
      .from("agency_members")
      .insert({
        agency_id: agencyId,
        email,
        status: "invited",
      })
      .select("id")
      .single();
    memberId = inserted?.id ?? null;
  }

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  await sendNotificationEmail(
    email,
    `You've been invited to join ${agency.name} on CueProperty`,
    `${(user.user_metadata?.full_name as string | undefined) ?? user.email} has invited you to join ${agency.name}'s CueProperty agency plan.\n\nLog in or sign up with this email address (${email}) at ${origin}/login, then go to Settings to accept the invite.`,
  );

  return NextResponse.json({ success: true, memberId });
}
