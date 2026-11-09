import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/Wordmark";
import { JsonLd, ORGANIZATION } from "@/components/JsonLd";
import { DEFAULT_SITE_URL } from "@/lib/brand";

// Search landing page for "open home sign in app" (Australia) and
// "open house sign in app" (US). Answer-first copy so Google and AI answers
// can quote it; FAQ and HowTo structured data below.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
const PATH = "/open-home-sign-in-app";

const TITLE = "Open Home Sign-In App for Real Estate Agents | Open Home Hero";
const DESCRIPTION =
  "A digital open home (open house) sign-in sheet: visitors scan a QR code, sign in on their own phone, and every lead goes straight into your CRM. 14-day free trial.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH },
};

const STEPS = [
  {
    title: "Create the listing",
    text: "Add the address and a few details. Open Home Hero makes a QR code and a link for that property straight away.",
  },
  {
    title: "Put the QR code at the door",
    text: "Print it on your flyer or a sign at the entrance, or add the link to your online listing.",
  },
  {
    title: "Visitors sign in on their own phone",
    text: "They scan, type their name, email and phone, and leave feedback or an offer. No app, no account, about a minute.",
  },
  {
    title: "Every visitor lands in your CRM",
    text: "Each sign-in goes to your dashboard and, if you connect one, into your CRM within seconds, tagged with the property address.",
  },
];

const PAPER_VS_DIGITAL = [
  {
    topic: "Readable details",
    paper: "Handwriting you have to decode, half-finished emails and phone numbers",
    digital: "Visitors type their own details, and email and phone are required",
  },
  {
    topic: "Privacy",
    paper: "Every visitor can read the names and numbers above theirs",
    digital: "Each visitor only sees their own form",
  },
  {
    topic: "Follow-up",
    paper: "Retype the sheet into your CRM after the open home",
    digital: "Leads are already in your CRM with their feedback attached",
  },
  {
    topic: "Feedback for the vendor",
    paper: "Whatever you remember from the door",
    digital: "Interest level, ratings and comments from every visitor, by listing",
  },
  {
    topic: "Offers",
    paper: "Calls, texts and emails in different places",
    digital: "Offers side by side, sorted by what your seller cares about",
  },
];

const CAPTURED = [
  "Name, email and mobile (all required)",
  "How interested they are and what they thought",
  "Ratings for the property and price",
  "Buying timeframe and finance status",
  "Offers with amount, finance and settlement terms",
  "Which listing and when they visited",
];

const FAQS = [
  {
    question: "What is an open home sign-in app?",
    answer:
      "An open home sign-in app (called an open house sign-in app in the US) replaces the paper sign-in sheet at the front door. Visitors scan a QR code and enter their details on their own phone, so the agent gets clean, readable contact details and can follow up straight away. Open Home Hero also collects each visitor's feedback or offer and sends them into the agent's CRM.",
  },
  {
    question: "Do visitors need to download an app?",
    answer:
      "No. Visitors scan the QR code with their phone camera and the sign-in form opens in their browser. There is no app to install and no account to create.",
  },
  {
    question: "Does it work with my CRM?",
    answer:
      "Yes. Open Home Hero sends every visitor to Follow Up Boss, HubSpot, Lofty or Pipedrive today, with VaultRE, Rex, AgentBox and Box+Dice coming soon. Repeat visitors are matched, not duplicated. If you use another CRM, you can export every lead as a CSV and import it.",
  },
  {
    question: "Can I use a QR code for open house sign-in instead of an iPad?",
    answer:
      "Yes, and it is usually faster. With a QR code, several visitors can sign in at once on their own phones instead of queuing for one tablet, and you don't need to bring, charge or watch a device. Print the code on your flyer or a sign at the door.",
  },
  {
    question: "Is it free?",
    answer:
      "Every account starts with a 14-day free trial with every feature included. After that it is one plan: $39 a month or $390 a year (AUD), with discounts for agencies.",
  },
  {
    question: "Is it only for Australia?",
    answer:
      "Open Home Hero is built in Australia and uses Australian terms like open home and inspection, but it works anywhere. The CRMs it connects to today (Follow Up Boss, HubSpot, Lofty and Pipedrive) are widely used by agents in the US too.",
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
    "@type": "SoftwareApplication",
    name: "Open Home Hero",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    url: SITE_URL,
    description:
      "Open home (open house) sign-in app for real estate agents. Visitors sign in by QR code on their own phone, leave feedback or an offer, and every lead is sent to the agent's CRM.",
    offers: { "@type": "Offer", price: "39", priceCurrency: "AUD", url: `${SITE_URL}/signup` },
    featureList: [
      "QR code open home sign-in",
      "Digital open house sign-in sheet",
      "Visitor feedback for vendors",
      "Offer collection and comparison",
      "CRM integration: Follow Up Boss, HubSpot, Lofty, Pipedrive",
      "CSV export",
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to run a digital open home sign-in with a QR code",
    step: STEPS.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.title, text: s.text })),
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

export default function OpenHomeSignInAppPage() {
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
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brass">
            Open home sign-in app
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-tight text-ink sm:text-5xl">
            The open home sign-in sheet that fills your CRM for you
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-soft">
            Open Home Hero replaces the paper sign-in sheet with a QR code. Visitors sign in on their
            own phone, leave feedback or an offer, and every lead goes straight into Follow Up Boss,
            HubSpot, Lofty or Pipedrive. No app for visitors, no retyping after the open home.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup">
              <Button variant="primary">Start your 14-day free trial</Button>
            </Link>
            <Link href="/preview">
              <Button variant="secondary">See what visitors see</Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink-soft">$39/month after the trial · Cancel anytime</p>
        </section>

        <section className="border-t border-line bg-paper-card px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-serif text-3xl font-medium text-ink">
              How QR code open home sign-in works
            </h2>
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

        <section className="border-t border-line px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-serif text-3xl font-medium text-ink">
              Paper sign-in sheet vs a digital sign-in
            </h2>
            <div className="mt-10 overflow-x-auto rounded-md border border-line">
              <table className="w-full min-w-[560px] bg-paper-card text-left text-sm">
                <thead>
                  <tr className="border-b border-line">
                    <th className="px-5 py-3 font-medium text-ink-soft"></th>
                    <th className="px-5 py-3 font-medium text-ink-soft">Paper sheet</th>
                    <th className="px-5 py-3 font-medium text-brass">Open Home Hero</th>
                  </tr>
                </thead>
                <tbody>
                  {PAPER_VS_DIGITAL.map((row) => (
                    <tr key={row.topic} className="border-t border-line align-top">
                      <th scope="row" className="px-5 py-4 font-medium text-ink">
                        {row.topic}
                      </th>
                      <td className="px-5 py-4 text-ink-soft">{row.paper}</td>
                      <td className="px-5 py-4 text-ink">{row.digital}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-paper-card px-6 py-16">
          <div className="mx-auto grid max-w-4xl gap-10 sm:grid-cols-2">
            <div>
              <h2 className="font-serif text-2xl font-medium text-ink">What every sign-in captures</h2>
              <ul className="mt-5 space-y-2 text-sm text-ink">
                {CAPTURED.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-brass">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-serif text-2xl font-medium text-ink">Sends leads to your CRM</h2>
              <p className="mt-5 text-sm leading-relaxed text-ink-soft">
                Connect once in Settings and every visitor is created or matched in your CRM, with
                their feedback or offer added as a note. Connected today:
              </p>
              <p className="mt-3 font-serif text-lg text-ink">Follow Up Boss · HubSpot · Lofty · Pipedrive</p>
              <p className="mt-3 text-sm text-ink-soft">
                Coming soon: VaultRE, Rex, AgentBox and Box+Dice. Any other CRM: export a CSV.
              </p>
              <Link href="/#crm" className="mt-4 inline-block text-sm text-brass underline">
                How the CRM connection works
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-line px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-serif text-3xl font-medium text-ink">Questions agents ask</h2>
            <div className="mt-10 space-y-3">
              {FAQS.map((faq) => (
                <details key={faq.question} className="rounded-md border border-line bg-paper-card p-5">
                  <summary className="cursor-pointer font-medium text-ink">{faq.question}</summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-navy px-6 py-16 text-center">
          <h2 className="font-serif text-3xl font-medium text-paper">Bin the paper sheet at your next open home</h2>
          <p className="mx-auto mt-3 max-w-xl text-navy-soft">
            Set up a listing in two minutes and have your QR code ready for Saturday.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button variant="primary">Start your 14-day free trial</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line px-6 py-6 text-center text-xs text-ink-soft">
        <p>© 2026 Open Home Hero</p>
        <p className="mt-2">
          <Link href="/" className="underline hover:text-brass">Home</Link>
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
