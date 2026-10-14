import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmailChecked } from "@/lib/notificationEmail";
import { siteOrigin } from "@/lib/siteUrl";
import { checkRateLimit } from "@/lib/rateLimit";
import { INVITE_DAYS } from "@/lib/agencyInvites";
import { ValidationError, email as parseEmail, readJsonObject, requiredText, uuid } from "@/lib/validate";

// Invites an agent to the owner's agency. Nothing about the invited person's
// account changes here: no account is created and no subscription is touched.
// They get an email, sign in with their own login, and choose to accept (see
// /api/agency/accept).
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!(await checkRateLimit("agency-invite", user.id))) {
    return NextResponse.json(
      { error: "Too many invitations. Please try again shortly." },
      { status: 429 },
    );
  }

  let agencyId: string;
  let name: string;
  let email: string;
  try {
    const body = await readJsonObject(request);
    agencyId = uuid(body.agencyId, "agency");
    name = requiredText(body.name, "name", 100).replace(/[\r\n]+/g, " ");
    email = parseEmail(body.email);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: "A name and valid email are required." }, { status: 400 });
    }
    throw error;
  }

  const service = createServiceClient();

  const { data: agency } = await service
    .from("agencies")
    .select("id, name, owner_user_id, stripe_subscription_id, seats")
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

  if (user.email && email === user.email.toLowerCase()) {
    return NextResponse.json(
      { error: "You're already the owner of this agency." },
      { status: 400 },
    );
  }

  // Open invitations hold a licence until they're accepted or expire, so the
  // owner can never invite more people than they've paid for.
  const cutoff = new Date(Date.now() - INVITE_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const [{ count: activeCount }, { count: openInvites }, { data: existingMember }] = await Promise.all([
    service
      .from("agency_members")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .eq("status", "active"),
    service
      .from("agency_members")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .eq("status", "invited")
      .gt("invited_at", cutoff),
    service
      .from("agency_members")
      .select("id, status")
      .eq("agency_id", agencyId)
      .eq("email", email)
      .maybeSingle(),
  ]);

  if (existingMember?.status === "active") {
    return NextResponse.json({ error: "Already a member." }, { status: 400 });
  }

  const alreadyHoldingASeat = existingMember?.status === "invited" ? 1 : 0;
  if ((activeCount ?? 0) + (openInvites ?? 0) - alreadyHoldingASeat >= agency.seats) {
    return NextResponse.json(
      { error: "All your licences are in use or reserved by open invitations. Add a licence first." },
      { status: 400 },
    );
  }

  const memberData = {
    agency_id: agencyId,
    user_id: null,
    email,
    status: "invited" as const,
    invited_at: new Date().toISOString(),
    joined_at: null,
    removed_at: null,
  };

  let memberId: string;
  if (existingMember) {
    const { error } = await service.from("agency_members").update(memberData).eq("id", existingMember.id);
    if (error) {
      console.error("Agency invite update failed:", error.message);
      return NextResponse.json({ error: "Could not send the invitation." }, { status: 500 });
    }
    memberId = existingMember.id;
  } else {
    const { data: inserted, error } = await service
      .from("agency_members")
      .insert(memberData)
      .select("id")
      .single();
    if (error || !inserted) {
      console.error("Agency invite insert failed:", error?.message);
      return NextResponse.json({ error: "Could not send the invitation." }, { status: 500 });
    }
    memberId = inserted.id;
  }

  const origin = siteOrigin(request);
  const emailSent = await sendEmailChecked(
    email,
    `You've been invited to join ${agency.name}`,
    `Hi ${name},\n\n${user.email ?? "An agency owner"} has invited you to join "${agency.name}" so your licence is covered by their agency plan.\n\nTo accept, log in with this email address (or create a free account with it) and choose Accept on your dashboard:\n${origin}/login\n\nIf you already pay for your own subscription, it is only cancelled if you accept. If you don't know this person, ignore this email and nothing will change. The invitation expires in ${INVITE_DAYS} days.`,
  );

  return NextResponse.json({ success: true, memberId, email, emailSent });
}
