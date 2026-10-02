import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: agency } = await service
    .from("agencies")
    .select("stripe_customer_id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!agency?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account yet." },
      { status: 400 },
    );
  }

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: agency.stripe_customer_id,
      return_url: `${origin}/dashboard/agency`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Agency Stripe billing portal session creation failed:", error);
    const message = error instanceof Error ? error.message : "Could not open billing portal.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
