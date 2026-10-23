import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/Wordmark";
import { PreviewPlayer, PREVIEW_POSTER, PREVIEW_VIDEO } from "@/components/landing/VideoPreview";
import { DEFAULT_SITE_URL } from "@/lib/brand";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

export const metadata: Metadata = {
  title: "See Open Home Hero in action — 45-second preview",
  description:
    "Watch how Open Home Hero turns every visitor at an open home or rental inspection into feedback, an offer or a rental application, all in one dashboard.",
  alternates: { canonical: "/preview" },
  openGraph: {
    title: "See Open Home Hero in action",
    description:
      "A 45-second preview: one QR code per listing, and every application lands in one organised list.",
    url: "/preview",
  },
};

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-3xl items-center px-6 py-6">
        <Link href="/" className="font-serif text-xl tracking-tight">
          <Wordmark tone="dark" />
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20 text-center">
        <h1 className="font-serif text-3xl font-medium text-ink">
          See Open Home Hero in action
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-ink-soft">
          Every visitor scans one QR code, or taps the link in your listing, and
          the form opens on their phone. No app, no account. Everything lands in
          one dashboard, organised by property.
        </p>

        <PreviewPlayer className="mt-10 max-w-[340px]" />

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/signup">
            <Button variant="primary">Start your 14-day free trial</Button>
          </Link>
          <Link href="/#visitors">
            <Button variant="secondary">See the sample forms</Button>
          </Link>
        </div>
        <p className="mt-4 text-sm text-ink-soft">
          Questions? Email us any time via the{" "}
          <Link href="/contact" className="text-brass underline">
            contact page
          </Link>
          .
        </p>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            name: "Open Home Hero: rental applications in 45 seconds",
            description:
              "A short walkthrough of how Open Home Hero collects rental applications from visitors' phones into one organised dashboard.",
            thumbnailUrl: `${SITE_URL}${PREVIEW_POSTER}`,
            contentUrl: `${SITE_URL}${PREVIEW_VIDEO}`,
            uploadDate: "2026-10-23",
            duration: "PT46S",
            publisher: { "@type": "Organization", name: "Open Home Hero", url: SITE_URL },
          }),
        }}
      />
    </div>
  );
}
