import { BRAND_NAME, CONTACT_EMAIL, DEFAULT_SITE_URL } from "@/lib/brand";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

/**
 * Structured data (schema.org JSON-LD) for a simple public page, so search
 * engines and AI tools can tell what the page is and who publishes it.
 * `<` is escaped as recommended in the Next.js JSON-LD guide.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export const ORGANIZATION = {
  "@type": "Organization",
  name: BRAND_NAME,
  url: SITE_URL,
  email: CONTACT_EMAIL,
};

/** A WebPage entry for a plain public page (security, privacy, terms…). */
export function webPage(path: string, name: string, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name,
    description,
    url: `${SITE_URL}${path}`,
    inLanguage: "en-AU",
    isPartOf: { "@type": "WebSite", name: BRAND_NAME, url: SITE_URL },
    publisher: ORGANIZATION,
  };
}
