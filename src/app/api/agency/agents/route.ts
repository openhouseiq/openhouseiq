import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmailChecked } from "@/lib/notificationEmail";

function generateTempPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 16);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const agencyId = String(body.agencyId ?? "");
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();

  if (!agencyId || !name || !email || !email.includes("@")) {
    return NextResponse.json({ error: "A name and valid email are required." }, { status: 400 });
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

  const { count: activeCount } = await service
    .from("agency_members")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .eq("status", "active");

  if ((activeCount ?? 0) >= agency.seats) {
    return NextResponse.json(
      { error: "All your licences are in use. Add a licence first, then add this agent." },
      { status: 400 },
    );
  }

  const { data: existingMember } = await service
    .from("agency_members")
    .select("id, status")
    .eq("agency_id", agencyId)
    .eq("email", email)
    .maybeSingle();

  if (existingMember && existingMember.status === "active") {
    return NextResponse.json({ error: "Already a member." }, { status: 400 });
  }

  if (user.email && email === user.email.toLowerCase()) {
    return NextResponse.json(
      { error: "You're already the owner of this agency." },
      { status: 400 },
    );
  }

  // Look up whether this email already belongs to an OpenHouseIQ account.
  let existingUserId: string | null = null;
  let page = 1;
  while (!existingUserId) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) existingUserId = match.id;
    if (match || data.users.length < 200) break;
    page += 1;
  }

  let isNewAccount = false;

  if (existingUserId) {
    // A person can belong to only one agency at a time — it decides whose
    // listings they can see and manage.
    const [{ data: ownsAgency }, { data: otherMembership }] = await Promise.all([
      service.from("agencies").select("id").eq("owner_user_id", existingUserId).maybeSingle(),
      service
        .from("agency_members")
        .select("id")
        .eq("user_id", existingUserId)
        .eq("status", "active")
        .neq("agency_id", agencyId)
        .maybeSingle(),
    ]);

    if (ownsAgency || otherMembership) {
      return NextResponse.json(
        { error: "That person already belongs to another agency." },
        { status: 400 },
      );
    }

    // Already has an account — if it has its own paid subscription, cancel
    // it; they're now covered by the agency's seat instead.
    const { data: ownSubscription } = await service
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", existingUserId)
      .maybeSingle();

    if (
      ownSubscription?.stripe_subscription_id &&
      (ownSubscription.status === "active" || ownSubscription.status === "trialing")
    ) {
      try {
        await stripe.subscriptions.cancel(ownSubscription.stripe_subscription_id);
      } catch (error) {
        console.error("Could not cancel individual subscription on agency add:", error);
      }
    }
  } else {
    isNewAccount = true;
    const { data: created, error: createError } = await service.auth.admin.createUser({
      email,
      password: generateTempPassword(),
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (createError || !created.user) {
      return NextResponse.json(
        { error: createError?.message ?? "Could not create the agent's account." },
        { status: 400 },
      );
    }

    existingUserId = created.user.id;
  }

  const memberData = {
    agency_id: agencyId,
    user_id: existingUserId,
    email,
    status: "active" as const,
    joined_at: new Date().toISOString(),
  };

  let memberId: string;
  if (existingMember) {
    await service.from("agency_members").update(memberData).eq("id", existingMember.id);
    memberId = existingMember.id;
  } else {
    const { data: inserted, error: insertError } = await service
      .from("agency_members")
      .insert(memberData)
      .select("id")
      .single();
    if (insertError || !inserted) {
      return NextResponse.json(
        { error: insertError?.message ?? "Could not add the agent." },
        { status: 400 },
      );
    }
    memberId = inserted.id;
  }

  // Tell the agent they've been added. New accounts get a link to choose
  // their own password; nobody is ever sent or shown a password.
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;
  const ownerName = (user.user_metadata?.full_name as string | undefined) || user.email || "Your agency";

  let setupLink: string | null = null;
  let emailSent = false;

  if (isNewAccount) {
    const { data: linkData } = await service.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${origin}/reset-password` },
    });
    setupLink = linkData?.properties?.action_link ?? null;
    if (setupLink) {
      emailSent = await sendEmailChecked(
        email,
        `${agency.name} has added you to CueProperty`,
        `Hi ${name},\n\n${ownerName} has added you to ${agency.name} on CueProperty. Your licence is already paid for by your agency.\n\nSet your password and log in here:\n${setupLink}\n\nAfter that you can log in any time at ${origin}/login.\n\n— CueProperty`,
      );
    }
  } else {
    emailSent = await sendEmailChecked(
      email,
      `${agency.name} has added you to CueProperty`,
      `Hi ${name},\n\n${ownerName} has added you to ${agency.name} on CueProperty. Your licence is now covered by your agency, so any personal subscription you had has been cancelled.\n\nLog in with your existing details at ${origin}/login.\n\n— CueProperty`,
    );
  }

  return NextResponse.json({
    success: true,
    memberId,
    email,
    isNewAccount,
    emailSent,
    // Only returned when the email couldn't be sent, so the owner can pass it on.
    setupLink: emailSent ? null : setupLink,
  });
}
