import { schedule } from "@netlify/functions";

// Pings a couple of key pages every 5 minutes so the site's serverless
// functions stay warm and real visitors (agents clicking a link, or
// open-house guests scanning a QR code) never hit a cold-start delay.
const URLS = [
  "https://www.cueproperty.com.au/",
  "https://www.cueproperty.com.au/signup",
];

export const handler = schedule("*/5 * * * *", async () => {
  await Promise.allSettled(URLS.map((url) => fetch(url)));
  return { statusCode: 200 };
});
