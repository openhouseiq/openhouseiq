import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

// The Supabase project the site talks to (database, login, photo storage).
function supabaseOrigins(): { http: string; ws: string } {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    return { http: `https://${url.host}`, ws: `wss://${url.host}` };
  } catch {
    return { http: "https://*.supabase.co", ws: "wss://*.supabase.co" };
  }
}

const supabase = supabaseOrigins();

// A fixed policy rather than per-request nonces: nonces would force every
// page to render fresh on each visit, which costs more on Netlify. This
// still blocks foreign scripts and frames, framing of the site, plugins,
// and form posts to other sites.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"} https://challenges.cloudflare.com https://connect.facebook.net`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabase.http} https://www.facebook.com`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabase.http} ${supabase.ws} https://challenges.cloudflare.com https://www.facebook.com https://connect.facebook.net`,
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework in every response.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
