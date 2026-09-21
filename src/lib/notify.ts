import { sendPushToAgent } from "@/lib/push";
import { sendNotificationEmail } from "@/lib/notificationEmail";
import { getAgentEmailNotificationsEnabled } from "@/lib/agent-notification-prefs";

type NotifyKind = "offer" | "feedback" | "applicant";

const KIND_LABELS: Record<NotifyKind, string> = {
  offer: "offer",
  feedback: "feedback",
  applicant: "applicant",
};

export async function notifyAgentOfSubmission({
  agentId,
  agentEmail,
  kind,
  listingAddress,
  listingId,
  baseUrl,
}: {
  agentId: string;
  agentEmail: string | null;
  kind: NotifyKind;
  listingAddress: string;
  listingId: string;
  baseUrl: string;
}): Promise<void> {
  const label = KIND_LABELS[kind];
  const title = `New ${label} on ${listingAddress}`;
  const path = `/dashboard/listings/${listingId}`;
  const body = `You've received a new ${label} on ${listingAddress}.`;

  const emailEnabled = agentEmail
    ? await getAgentEmailNotificationsEnabled(agentId)
    : false;

  await Promise.all([
    sendPushToAgent(agentId, { title, body, url: path }),
    emailEnabled
      ? sendNotificationEmail(agentEmail as string, title, `${body}\n\n${baseUrl}${path}`)
      : Promise.resolve(),
  ]);
}

export async function notifyAdminOfContactMessage({
  agentName,
  agentEmail,
  message,
  baseUrl,
}: {
  agentName: string;
  agentEmail: string;
  message: string;
  baseUrl: string;
}): Promise<void> {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (adminEmails.length === 0) return;

  const title = `New support message from ${agentName || agentEmail}`;
  const body = `${message}\n\n— ${agentName || "Agent"} (${agentEmail})\n\n${baseUrl}/admin`;

  await Promise.all(
    adminEmails.map((email) => sendNotificationEmail(email, title, body)),
  );
}

export async function notifyAgentOfContactReply({
  agentId,
  agentEmail,
  baseUrl,
}: {
  agentId: string;
  agentEmail: string | null;
  baseUrl: string;
}): Promise<void> {
  const title = "OpenHouseIQ support replied to your message";
  const path = "/dashboard/settings#contact";
  const body = "You have a reply to your Contact Us message.";

  const emailEnabled = agentEmail
    ? await getAgentEmailNotificationsEnabled(agentId)
    : false;

  await Promise.all([
    sendPushToAgent(agentId, { title, body, url: path }),
    emailEnabled
      ? sendNotificationEmail(agentEmail as string, title, `${body}\n\n${baseUrl}${path}`)
      : Promise.resolve(),
  ]);
}
