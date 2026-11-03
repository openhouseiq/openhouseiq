"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

// Paste the GA4 Measurement ID (looks like G-ABC123XYZ9) here to switch
// Google Analytics on. While it is empty nothing loads and nothing is sent.
export const GA_MEASUREMENT_ID = "";

// Only the public marketing pages are measured. The dashboard, admin and
// visitor pages (feedback, offers, rental applications) never load it.
const MEASURED = [
  "/",
  "/preview",
  "/signup",
  "/login",
  "/pricing",
  "/security",
  "/privacy",
  "/terms",
  "/contact",
];

export function GoogleAnalytics() {
  const pathname = usePathname();
  if (!GA_MEASUREMENT_ID || !MEASURED.includes(pathname)) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
