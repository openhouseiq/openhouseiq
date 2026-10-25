import { schedule } from "@netlify/functions";

// Runs the rental applications retention job once a day (about 3am Brisbane).
// The job itself lives in src/app/api/rental-retention/route.ts.
const SITE = (process.env.URL ?? "https://openhomehero.com.au").replace(/\/$/, "");

export const handler = schedule("0 17 * * *", async () => {
  const secret = process.env.RENTAL_RETENTION_SECRET;
  if (!secret) return { statusCode: 200 };
  const res = await fetch(`${SITE}/api/rental-retention`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  return { statusCode: res.ok ? 200 : 500 };
});
