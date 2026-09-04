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

  const supabase = createServiceClient();
  const { error } = await supabase.from("offers").insert({
    listing_id: body.listingId,
    name: body.name,
    email: body.email,
    phone: body.phone || null,
    offer_amount: body.offerAmount,
    financing_type: body.financingType || null,
    settlement_term: body.settlementTerm || null,
    waive_inspection: Boolean(body.waiveInspection),
    notes: body.notes || null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
