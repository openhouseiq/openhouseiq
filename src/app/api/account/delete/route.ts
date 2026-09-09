import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
