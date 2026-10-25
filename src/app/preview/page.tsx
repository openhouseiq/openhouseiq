import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/Wordmark";
import { PhoneMockups } from "@/components/landing/PhoneMockups";
import { DashboardMockup } from "@/components/landing/DashboardMockup";

export const metadata: Metadata = {
  title: "See Open Home Hero in action",
  description:
    "See what your visitors see at an open home, and how every offer lands in one dashboard, ranked against what your seller wants.",
  alternates: { canonical: "/preview" },
  openGraph: {
    title: "See Open Home Hero in action",
    description:
      "One QR code per listing. Visitors leave feedback or an offer from their phone, and every offer lands in one ranked dashboard.",
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
          one dashboard, organised by property. These are sample forms and a
          sample dashboard, using made-up data.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/signup">
            <Button variant="primary">Start your 14-day free trial</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">Back to the home page</Button>
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

      <PhoneMockups />

      <DashboardMockup />
    </div>
  );
}
