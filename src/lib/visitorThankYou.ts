import { createServiceClient } from "@/lib/supabase/service";
import { sendVisitorEmail } from "@/lib/notificationEmail";

// A short email to the visitor straight after they leave feedback or make an
// offer, sent on the agent's behalf. Replies go to the agent. It is a receipt
// for what the visitor just submitted, not marketing: one email, no links to
// anything else. Agents can turn it off in Settings → Notifications
// (user_metadata.visitor_thank_you_enabled, on unless set to false).

export type ThankYouKind = "feedback" | "offer";

export type ThankYouInput = {
  kind: ThankYouKind;
  visitorName: string;
  address: string;
  agentName: string;
  agentEmail: string | null;
  agentPhone: string | null;
  wantsFollowup?: boolean | null;
};

/** Builds the subject and plain-text body. Pure, so it can be tested. */
export function buildThankYouEmail(input: ThankYouInput): { subject: string; body: string } {
  const firstName = input.visitorName.trim().split(/\s+/)[0] || "there";
  const agent = input.agentName.trim() || "The agent";
  const signature = [agent, input.agentPhone?.trim(), input.agentEmail?.trim()].filter(Boolean).join("\n");

  if (input.kind === "offer") {
    return {
      subject: `Your offer on ${input.address} has been received`,
      body: [
        `Hi ${firstName},`,
        "",
        `${agent} has received your offer on ${input.address} and will be in touch about next steps.`,
        "",
        "This email confirms your offer was received. It is not an acceptance of the offer.",
        "",
        `Questions? Just reply to this email to reach ${agent} directly.`,
        "",
        signature,
        "",
        "--",
        `You're receiving this one-off email because you submitted an offer for ${input.address}. Sent by Open Home Hero on behalf of ${agent}.`,
      ].join("\n"),
    };
  }

  const followUp = input.wantsFollowup ? " and will call you back soon" : "";
  return {
    subject: `Thanks for visiting ${input.address}`,
    body: [
      `Hi ${firstName},`,
      "",
      `Thanks for coming through ${input.address} and signing in. ${agent} has your details${followUp}.`,
      "",
      `If you have any questions about the property, just reply to this email to reach ${agent} directly.`,
      "",
      signature,
      "",
      "--",
      `You're receiving this one-off email because you signed in at the open home for ${input.address}. Sent by Open Home Hero on behalf of ${agent}.`,
    ].join("\n"),
  };
}

/** Display name safe to put in a From header: no quotes, angle brackets or line breaks. */
export function safeDisplayName(name: string): string {
  return name.replace(/[\r\n"<>\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export async function sendVisitorThankYou(params: {
  kind: ThankYouKind;
  agentId: string;
  listingAgentName: string | null;
  listingAgentEmail: string | null;
  listingAddress: string;
  visitor: { name: string; email: string };
  wantsFollowup?: boolean | null;
}): Promise<void> {
  const { data } = await createServiceClient().auth.admin.getUserById(params.agentId);
  const meta = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
  if (meta.visitor_thank_you_enabled === false) return;

  const agentName =
    (typeof meta.full_name === "string" && meta.full_name.trim()) || params.listingAgentName?.trim() || "";
  const agentEmail = data.user?.email ?? params.listingAgentEmail;
  const agentPhone = typeof meta.phone === "string" ? meta.phone : null;

  const { subject, body } = buildThankYouEmail({
    kind: params.kind,
    visitorName: params.visitor.name,
    address: params.listingAddress,
    agentName,
    agentEmail,
    agentPhone,
    wantsFollowup: params.wantsFollowup,
  });

  const name = safeDisplayName(agentName);
  await sendVisitorEmail(params.visitor.email, subject, body, {
    fromName: name ? `${name} via Open Home Hero` : "Open Home Hero",
    replyTo: agentEmail ?? undefined,
  });
}
