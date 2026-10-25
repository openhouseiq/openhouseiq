import { NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { createServiceClient } from "@/lib/supabase/service";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { notifyAgentOfSubmission } from "@/lib/notify";
import { siteOrigin } from "@/lib/siteUrl";
import { ValidationError, readJsonObject, uuid } from "@/lib/validate";
import { getEnabledRentalForm } from "@/lib/rentalForms";
import {
  agentConfigComplete,
  cleanApplicantAnswers,
  contactFrom,
} from "@/lib/rentalForms/answers";

export async function POST(request: Request) {
  const ip = clientIp(request);
  if (!(await checkRateLimit("applicants", ip))) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again shortly." },
      { status: 429 },
    );
  }

  let listingId: string;
  let turnstileToken: string;
  let rawAnswers: Record<string, unknown>;
  try {
    const body = await readJsonObject(request);
    turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
    listingId = uuid(body.listingId, "listing");
    const a = body.answers;
    if (typeof a !== "object" || a === null || Array.isArray(a)) {
      throw new ValidationError("Invalid answers");
    }
    rawAnswers = a as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
    }
    throw error;
  }

  if (!(await verifyTurnstileToken(turnstileToken, ip))) {
    return NextResponse.json(
      { error: "CAPTCHA verification failed. Please try again." },
      { status: 400 },
    );
  }

  if (!(await checkRateLimit("applicants-listing", listingId))) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again shortly." },
      { status: 429 },
    );
  }

  const supabase = createServiceClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("agent_id, agent_email, address, listing_type, state, rental_config")
    .eq("id", listingId)
    .maybeSingle();

  if (!listing || listing.listing_type !== "rental") {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  // Applications are only accepted for a state whose form is built and switched
  // on, and only once the agent has completed that form's agent-side items.
  const form = getEnabledRentalForm(listing.state);
  if (!form || !agentConfigComplete(form, listing.rental_config)) {
    return NextResponse.json(
      { error: "Applications are not open for this property yet." },
      { status: 409 },
    );
  }

  let answers;
  try {
    answers = cleanApplicantAnswers(form, rawAnswers);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
    }
    throw error;
  }

  const contact = contactFrom(answers);
  const consentName = typeof answers.consent_name === "string" ? answers.consent_name : null;

  const { error } = await supabase.from("rental_applications").insert({
    listing_id: listingId,
    state: form.state,
    form_version: form.version,
    answers,
    applicant_name: contact.name,
    email: contact.email,
    phone: contact.phone,
    consent_name: consentName,
    consent_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Rental application insert failed:", error.message);
    return NextResponse.json(
      { error: "Could not save your application. Please try again." },
      { status: 500 },
    );
  }

  await notifyAgentOfSubmission({
    agentId: listing.agent_id,
    agentEmail: listing.agent_email,
    kind: "applicant",
    listingAddress: listing.address,
    listingId,
    baseUrl: siteOrigin(request),
  });

  return NextResponse.json({ success: true });
}
