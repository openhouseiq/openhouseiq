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
