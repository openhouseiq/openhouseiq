import { schedule } from "@netlify/functions";

// Re-sends visitors to agencies' CRMs when the first try failed. Every 15 min.
// The job itself lives in src/app/api/crm/retry/route.ts.
const SITE = (process.env.URL ?? "https://openhomehero.com.au").replace(/\/$/, "");

export const handler = schedule("*/15 * * * *", async () => {
  const secret = process.env.CRM_RETRY_SECRET || process.env.CONTENT_QUEUE_PUBLISH_SECRET;
  if (!secret) return { statusCode: 200 };
  const res = await fetch(`${SITE}/api/crm/retry`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  return { statusCode: res.ok ? 200 : 500 };
});
