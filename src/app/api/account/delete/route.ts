import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rateLimit";
import { readJsonObject, requiredText } from "@/lib/validate";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  if (!(await checkRateLimit("account-delete", user.id))) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again shortly." },
      { status: 429 },
    );
  }

  // Deleting an account can't be undone, so a signed-in session alone isn't
  // enough: the account's password must be entered again.
  let password: string;
  try {
    const body = await readJsonObject(request);
    password = requiredText(body.password, "password", 1024);
  } catch {
    return NextResponse.json({ error: "Enter your password to confirm." }, { status: 400 });
  }

  const verifier = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error: passwordError } = await verifier.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (passwordError) {
    return NextResponse.json({ error: "That password is incorrect." }, { status: 403 });
  }

  const service = createServiceClient();

  const { data: listings } = await service
    .from("listings")
    .select("id")
    .eq("agent_id", user.id);

  for (const listing of listings ?? []) {
    const { data: files } = await service.storage
      .from("listing-photos")
      .list(`${user.id}/${listing.id}`);
    if (files && files.length > 0) {
      await service.storage
        .from("listing-photos")
        .remove(files.map((f) => `${user.id}/${listing.id}/${f.name}`));
    }
  }

  const { data: assetFiles } = await service.storage
    .from("agent-assets")
    .list(user.id);
  if (assetFiles && assetFiles.length > 0) {
    await service.storage
      .from("agent-assets")
      .remove(assetFiles.map((f) => `${user.id}/${f.name}`));
  }

  const { data: subscription } = await service
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscription?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(subscription.stripe_subscription_id);
    } catch {
      // Subscription may already be canceled/inactive — proceed with deletion regardless.
    }
  }

  const { error } = await service.auth.admin.deleteUser(user.id);

  if (error) {
    console.error("Account deletion failed:", error.message);
    return NextResponse.json({ error: "Could not delete the account. Please contact support." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
