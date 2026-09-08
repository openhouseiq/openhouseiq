import Link from "next/link";
import { Button } from "@/components/ui/Button";

const FEATURES = [
  {
    title: "A QR code for every listing",
    description:
      "Generated automatically the moment you create a listing. Download it and add it to your open home flyer or signage.",
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

const STEPS = [
  {
    number: "1",
    title: "Create a listing",
    description: "Add the address, price, and details. Add photos if you have them.",
  },
  {
    number: "2",
    title: "Print your QR code",
    description:
      "Every listing gets its own QR code, ready to download and print for the open house.",
  },
  {
    number: "3",
    title: "Visitors scan and respond",
    description:
      "No app to download, no account to create. Feedback or an offer in under a minute.",
  },
  {
    number: "4",
    title: "Follow up with confidence",
    description:
      "See every response in your dashboard as it comes in, and export a report anytime.",
  },
];

const INCLUDED = [
  "Unlimited listings and QR codes",
  "Structured visitor feedback & offers",
  "CSV export reports by date range",
  "CAPTCHA-protected public forms",
  "14-day free trial, no card required",
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

      <section className="border-t border-line bg-paper-card px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-medium text-ink">
              How it works
            </h2>
            <p className="mt-3 text-ink-soft">
              From new listing to your first lead, in four steps.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.number}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-serif text-sm font-medium text-paper">
                  {step.number}
                </div>
                <h3 className="mt-4 font-serif text-lg font-medium text-ink">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/signup">
              <Button variant="primary">Get started free</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-line px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-medium text-ink">
            Simple pricing
          </h2>
          <p className="mt-3 text-ink-soft">
            One plan, every feature. Start with a 14-day free trial — no card
            required.
          </p>
          <div className="mx-auto mt-10 grid max-w-xl gap-6 sm:grid-cols-2">
            <div className="rounded-md border border-line bg-paper-card p-8">
              <p className="text-sm font-medium text-ink-soft">Monthly</p>
              <p className="mt-2 font-serif text-4xl font-medium text-ink">
                $29
                <span className="text-base font-sans font-normal text-ink-soft">
                  /month
                </span>
              </p>
            </div>
            <div className="rounded-md border-2 border-pine bg-paper-card p-8">
              <p className="text-sm font-medium text-pine">Yearly · save 2 months</p>
              <p className="mt-2 font-serif text-4xl font-medium text-ink">
                $290
                <span className="text-base font-sans font-normal text-ink-soft">
                  /year
                </span>
              </p>
            </div>
          </div>

          <ul className="mx-auto mt-10 max-w-md space-y-2 text-left">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-ink">
                <span className="mt-0.5 text-pine">✓</span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <Link href="/signup">
              <Button variant="primary">Start your free trial</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line px-6 py-6 text-center text-xs text-ink-soft">
        <p>© 2026 OpenHouseIQ</p>
        <p className="mt-2">
          <Link href="/terms" className="underline hover:text-pine">
            Terms
          </Link>
          <span className="mx-2">·</span>
          <Link href="/privacy" className="underline hover:text-pine">
            Privacy
          </Link>
        </p>
      </footer>
    </div>
  );
}
