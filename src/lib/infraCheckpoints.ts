import { createServiceClient } from "@/lib/supabase/service";
import { sendNotificationEmail } from "@/lib/notificationEmail";

const CHECKPOINTS: { count: number; action: string }[] = [
  {
    count: 4,
    action:
      "Move both Netlify and Supabase off their free tiers to Pro (Netlify Pro $20/mo, Supabase Pro $25/mo). Supabase's free tier pauses the project after a week of inactivity, which isn't acceptable once you have paying customers.",
  },
  {
    count: 50,
    action:
      "Step Netlify up to the 5,000-credit tier ($33/mo) for extra headroom ahead of real usage pressure.",
  },
  {
    count: 100,
    action:
      "Step Netlify up to the 10,000-credit tier ($63/mo). Also check Supabase's usage dashboard (Project settings -> Usage) - you may need a compute add-on if it's over ~70% of included compute.",
  },
  {
    count: 200,
    action:
      "Step Netlify up to the 15,000-20,000-credit tier ($95-126/mo). Supabase likely needs a dedicated compute add-on by now - check the usage dashboard.",
  },
  {
    count: 300,
    action:
      "Time for an Enterprise conversation with Netlify, and consider Supabase's Team plan ($599/mo). Standard tiers on either platform are unlikely to comfortably cover this scale.",
  },
];

/**
 * Checks the current total subscriber count against a fixed set of
 * infrastructure scaling checkpoints, and emails the admin the moment a
 * new one is crossed - so the Netlify/Supabase upgrade happens right when
 * it's needed, not whenever someone next remembers to check a dashboard.
 * Fires at most once per checkpoint (exact count match), from the Stripe
 * webhook right after a new subscription is recorded.
 */
export async function checkInfrastructureCheckpoint(): Promise<void> {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("subscriptions")
    .select("*", { count: "exact", head: true });

  if (count === null) return;

  const checkpoint = CHECKPOINTS.find((c) => c.count === count);
  if (!checkpoint) return;

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  await Promise.all(
    adminEmails.map((email) =>
      sendNotificationEmail(
        email,
        `OpenHouseIQ just hit ${count} subscribers - infrastructure checkpoint`,
        `You've reached ${count} subscribers.\n\n${checkpoint.action}`,
      ),
    ),
  );
}
