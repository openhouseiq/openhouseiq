"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { MEASURED_PATHS } from "@/lib/measuredPaths";

// Cloudflare Web Analytics: free, no cookies, no individual-visitor tracking.
// The token is a public site ID, not a secret.
const CF_BEACON_TOKEN = "60106a6132c746f59b0dd4c306916927";

export function CloudflareAnalytics() {
  const pathname = usePathname();
  if (!MEASURED_PATHS.includes(pathname)) return null;
  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token: CF_BEACON_TOKEN })}
      strategy="afterInteractive"
    />
  );
}
