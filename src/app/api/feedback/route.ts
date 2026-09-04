import { NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const body = await request.json();

  // Honeypot: pretend success without touching the database.
  if (String(body.website ?? "")) {
    return NextResponse.json({ success: true });
  }

  const verified = await verifyTurnstileToken(String(body.turnstileToken ?? ""));
  if (!verified) {
    return NextResponse.json(
      { error: "CAPTCHA verification failed. Please try again." },
      { status: 400 },
    );
  }

  const isAnonymous = Boolean(body.isAnonymous);
  const supabase = createServiceClient();
  const { error } = await supabase.from("feedback").insert({
    listing_id: body.listingId,
    is_anonymous: isAnonymous,
    name: isAnonymous ? null : body.name || null,
    email: isAnonymous ? null : body.email || null,
    phone: isAnonymous ? null : body.phone || null,
    rating: body.rating || null,
    comments: body.comments || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
