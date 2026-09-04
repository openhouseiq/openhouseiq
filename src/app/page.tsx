import Link from "next/link";
import { Button } from "@/components/ui/Button";

const FEATURES = [
  {
    title: "A QR code for every listing",
    description:
      "Print it, prop it on the counter, and every visitor at your open house can scan it in seconds.",
  },
  {
    title: "Instant feedback & offers",
    description:
      "Visitors leave feedback or submit an offer right from their phone — no app to download, no login required.",
  },
  {
    title: "Every lead, one dashboard",
    description:
      "See new feedback and offers the moment they come in, organized by listing.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-serif text-xl tracking-tight">
          <span className="text-ink">OpenHouse</span>
          <span className="text-brass">IQ</span>
        </span>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-ink-soft hover:text-pine">
            Log in
          </Link>
          <Link href="/signup">
            <Button variant="primary">Sign up</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-serif text-4xl font-medium leading-tight text-ink sm:text-5xl">
          Run better open houses.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">
          OpenHouseIQ turns every open house into a lead-generating machine —
          one QR code, instant visitor feedback and offers, no paper sign-in
          sheets.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup">
            <Button variant="primary">Get started free</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary">Log in</Button>
          </Link>
        </div>
      </main>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-md border border-line bg-paper-card p-6"
            >
              <h2 className="font-serif text-lg font-medium text-ink">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line px-6 py-6 text-center text-xs text-ink-soft">
        © 2026 OpenHouseIQ
      </footer>
    </div>
  );
}
