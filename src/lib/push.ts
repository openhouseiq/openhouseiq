import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase/service";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

if (publicKey && privateKey && subject) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}


// Push notifications are only ever sent to the browser makers' own push
// services. An agent registers the address themselves, so anything else
// (for example an internal address) must never be contacted.
const PUSH_HOST_SUFFIXES = [
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
  "push.services.mozilla.com",
  "web.push.apple.com",
  "push.apple.com",
  "notify.windows.com",
];

function isTrustedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.port) return false;
    return PUSH_HOST_SUFFIXES.some(
      (suffix) => url.hostname === suffix || url.hostname.endsWith(`.${suffix}`),
    );
  } catch {
    return false;
  }
}

export type PushPayload = {
  title: string;
  body: string;
  url: string;
};

export async function sendPushToAgent(
  agentId: string,
  payload: PushPayload,
): Promise<void> {
  if (!publicKey || !privateKey || !subject) return;

  const supabase = createServiceClient();
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key")
    .eq("agent_id", agentId);

  if (!subscriptions || subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (sub) => {
      if (!isTrustedPushEndpoint(sub.endpoint)) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        return;
      }
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          JSON.stringify(payload),
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }),
  );
}
