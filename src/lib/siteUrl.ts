/**
 * The public address of this site, used to build links in emails, Stripe
 * return pages and password-reset redirects. Prefers the configured
 * NEXT_PUBLIC_SITE_URL so a forged Host header can never decide where those
 * links point. Falls back to the request's own host only when no address
 * is configured (local development).
 */
export function siteOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === "https:" || url.hostname === "localhost") return url.origin;
    } catch {
      // fall through to the request host
    }
  }
  const host = request.headers.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}
