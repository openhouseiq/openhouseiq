import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/Wordmark";
import { JsonLd, ORGANIZATION } from "@/components/JsonLd";
import { DEFAULT_SITE_URL } from "@/lib/brand";

// For agents who run their business in Rex. Open Home Hero is pitched as an
// add-on that sits alongside Rex, never as a replacement: Rex stays the CRM,
// we add buyer feedback, offers and vendor reporting around the open home.
// Keep every statement about Rex neutral and factual.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
const PATH = "/for-rex-users";

const TITLE = "Open Home Hero for Rex users: add feedback and offers to your open homes";
const DESCRIPTION =
  "Keep Rex as your CRM. Open Home Hero adds structured buyer feedback, side-by-side offers and vendor-ready reporting to every open home, for $39 a month.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH },
};

const ADDS = [
  {
    title: "Feedback your vendor can actually use",
    text: "Every visitor rates price, condition, location and layout, says how interested they are, their timeframe and whether they're pre-approved. It's all organised by listing, ready for your vendor update.",
  },
  {
    title: "Offers side by side",
    text: "Buyers can submit an offer from the same QR code. Offers line up next to each other, sorted by what your vendor told you matters most: price, finance, settlement or conditions. You still decide.",
  },
  {
    title: "Your own questions",
    text: "Add up to three questions per listing, like \"Are you also looking to sell?\", and turn open home visitors into appraisal leads.",
  },
  {
    title: "No device at the door",
    text: "Visitors scan a QR code on your flyer or sign and use their own phone, so a busy open home doesn't queue at one tablet.",
  },
];

const STEPS = [
  {
    title: "Keep running your business in Rex",
    text: "Your contacts, listings, campaigns and pipeline stay exactly where they are.",
  },
  {
    title: "Add the listing to Open Home Hero",
    text: "Takes two minutes. You get a QR code and link for the open home.",
  },
  {
    title: "Visitors scan and respond",
    text: "Contact details, feedback and offers, from their own phone. No app, no account.",
  },
  {
    title: "Bring the visitors into Rex",
    text: "Export every visitor as a spreadsheet for your Rex contacts. A direct Rex connection is in the works.",
  },
];

const FAQS = [
  {
    question: "Do I have to stop using Rex?",
    answer:
      "No. Open Home Hero isn't a CRM and doesn't try to replace one. Rex stays your system for contacts, listings and campaigns. Open Home Hero handles what happens at the open home itself: visitor sign-in, structured feedback for the vendor, and offers compared side by side.",
  },
  {
    question: "How do visitors get into Rex?",
    answer:
      "Today, you export your visitors (with their feedback or offer) as a CSV spreadsheet and bring them into Rex. We're working on a direct Rex connection so they arrive automatically, the way they already do for Follow Up Boss, HubSpot, Lofty and Pipedrive.",
  },
  {
    question: "What does it cost?",
    answer:
      "$39 a month or $390 a year per agent (AUD), with every feature included and a 14-day free trial. Agencies with 3 or more agents get a discount per agent.",
  },
  {
    question: "Will my visitors need an app?",
    answer: "No. They scan the QR code with their phone camera and the form opens in their browser.",
  },
];

const STRUCTURED_DATA = [
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}${PATH}`,
    inLanguage: "en-AU",
    publisher: ORGANIZATION,
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  },
];

export default function ForRexUsersPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-navy px-6 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="whitespace-nowrap font-serif text-lg tracking-tight sm:text-xl">
            <Wordmark tone="light" />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-navy-soft hover:text-brass">
              Log in
            </Link>
            <Link href="/signup">
              <Button variant="primary">Start free trial</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-3xl px-6 py-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brass">For Rex users</p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-tight text-ink sm:text-5xl">
            Keep Rex. Get more out of every open home.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-soft">
            Rex runs your business. Open Home Hero sits alongside it at the open home, collecting
            structured buyer feedback and offers your vendor can see side by side, for $39 a month.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup">
              <Button variant="primary">Start your 14-day free trial</Button>
            </Link>
            <Link href="/preview">
              <Button variant="secondary">See what visitors see</Button>
            </Link>
          </div>
        </section>

        <section className="border-t border-line bg-paper-card px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-serif text-3xl font-medium text-ink">What it adds alongside Rex</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {ADDS.map((item) => (
                <div key={item.title} className="rounded-md border border-line bg-paper p-6">
                  <h3 className="font-serif text-lg font-medium text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-serif text-3xl font-medium text-ink">How it fits with Rex</h2>
            <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li key={step.title}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brass font-serif text-sm font-medium text-ink">
                    {i + 1}
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-medium text-ink">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-line bg-paper-card px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-serif text-3xl font-medium text-ink">Questions from Rex users</h2>
            <div className="mt-10 space-y-3">
              {FAQS.map((faq) => (
                <details key={faq.question} className="rounded-md border border-line bg-paper p-5">
                  <summary className="cursor-pointer font-medium text-ink">{faq.question}</summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-navy px-6 py-16 text-center">
          <h2 className="font-serif text-3xl font-medium text-paper">Try it at your next open home</h2>
          <p className="mx-auto mt-3 max-w-xl text-navy-soft">
            Rex stays exactly as it is. Set up one listing and see what your vendor gets.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button variant="primary">Start your 14-day free trial</Button>
            </Link>
          </div>
          <p className="mx-auto mt-6 max-w-xl text-xs text-navy-soft">
            Rex is a trademark of its owner. Open Home Hero is an independent product and is not
            affiliated with or endorsed by Rex.
          </p>
        </section>
      </main>

      <footer className="border-t border-line px-6 py-6 text-center text-xs text-ink-soft">
        <p>© 2026 Open Home Hero</p>
        <p className="mt-2">
          <Link href="/" className="underline hover:text-brass">Home</Link>
          <span className="mx-2">·</span>
          <Link href="/open-home-sign-in-app" className="underline hover:text-brass">Open home sign-in app</Link>
          <span className="mx-2">·</span>
          <Link href="/terms" className="underline hover:text-brass">Terms</Link>
          <span className="mx-2">·</span>
          <Link href="/privacy" className="underline hover:text-brass">Privacy</Link>
          <span className="mx-2">·</span>
          <Link href="/contact" className="underline hover:text-brass">Contact</Link>
        </p>
      </footer>

      <JsonLd data={STRUCTURED_DATA} />
    </div>
  );
}
