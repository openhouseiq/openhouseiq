import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/Wordmark";
import { PhoneMockups } from "@/components/landing/PhoneMockups";
import { DashboardMockup } from "@/components/landing/DashboardMockup";
import { HeroShowcase } from "@/components/landing/HeroShowcase";
import { DEFAULT_SITE_URL, FACEBOOK_PAGE_URL } from "@/lib/brand";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

export const metadata: Metadata = {
  title: "Open Home Hero — QR Code Feedback, Offers & Rental Applications for Agents",
  description:
    "Turn every open home or rental inspection into instant feedback, offers, and rental applications. One QR code, no paper sign-in sheets, no app for visitors to download. Built for real estate agents and property managers in Australia.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Open Home Hero — QR Code Feedback, Offers & Rental Applications for Agents",
    description:
      "One QR code per listing. Visitors leave feedback, submit an offer, or apply to rent from their phone — agents see every lead ranked in one dashboard.",
    url: "/",
  },
};


const FAQS = [
  {
    question: "What is Open Home Hero?",
    answer:
      "Open Home Hero is software for real estate agents and property managers that turns a QR code on your flyer or online listing into instant visitor feedback, offers, and rental applications at open homes and rental inspections — no app for visitors to download, no paper sign-in sheets.",
  },
  {
    question: "Does Open Home Hero work for rental inspections as well as sales?",
    answer:
      "Yes. Each listing is set up as either for sale or for rent. Sale listings collect feedback and offers; rental listings collect feedback and rental applications, ranked against what the landlord is looking for.",
  },
  {
    question: "Do visitors need to download an app or create an account?",
    answer:
      "No. Visitors scan the listing's QR code and submit feedback, an offer, or a rental application directly from their phone's browser — no app, no account.",
  },
  {
    question: "How much does Open Home Hero cost?",
    answer:
      "Open Home Hero is one plan with every feature included: $39/month or $390/year (two months free). New accounts start with a 14-day free trial.",
  },
  {
    question: "Is Open Home Hero a replacement for my CRM?",
    answer:
      "No. Open Home Hero isn't a CRM — it captures the moment someone walks into an open home or rental inspection, ranks the responses, and lets you export every lead as a CSV to import into whatever CRM you already use.",
  },
];

const FEATURES = [
  {
    title: "A QR code for every listing",
    description:
      "Generated automatically the moment you create a listing. Copy it onto your open home flyer, or attach the link to your online listing.",
  },
  {
    title: "Instant feedback, offers & applications",
    description:
      "Visitors leave feedback, submit an offer, or apply to rent — right from their phone. No app to download, no login required.",
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
    title: "Copy your QR code",
    description:
      "Every listing gets its own QR code and link. Paste the code onto your flyer, or attach the link to your online listing.",
  },
  {
    number: "3",
    title: "Visitors scan or tap and respond",
    description:
      "No app to download, no account to create. Feedback, an offer, or a rental application in under a minute.",
  },
  {
    number: "4",
    title: "Follow up with confidence",
    description:
      "See every response in your dashboard as it comes in, and export a report anytime.",
  },
];

const COMPARISON = [
  {
    crm: "Manages your whole pipeline, every contact, for months or years",
    us: "Captures the moment someone walks into an open home or rental inspection",
  },
  {
    crm: "Needs setup, custom fields, and training before it's useful",
    us: "Copy a QR code and go",
  },
  {
    crm: "Doesn't know what your seller or landlord actually cares about",
    us: "Ranks every offer or application against exactly that",
  },
];

const INCLUDED = [
  "Unlimited listings and QR codes",
  "Structured visitor feedback, offers & rental applications",
  "CSV export reports by date range",
  "CAPTCHA-protected public forms",
  "14-day free trial",
];

const AGENCY_TIERS = [
  { range: "1-2 agents", discount: "Full price" },
  { range: "3-10 agents", discount: "5% off per agent" },
  { range: "11-15 agents", discount: "10% off per agent" },
  { range: "16-20 agents", discount: "15% off per agent" },
  { range: "More than 20 agents", discount: "Contact us for pricing" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-navy px-6 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="whitespace-nowrap font-serif text-lg tracking-tight sm:text-xl">
            <Wordmark tone="light" />
          </span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-navy-soft hover:text-brass">
              Log in
            </Link>
            <Link href="/signup">
              <Button variant="primary">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_540px] lg:gap-12 lg:py-14">
        <div className="text-center lg:text-left">
          <h1 className="font-serif text-4xl font-medium leading-tight text-ink sm:text-5xl">
            Run better open homes.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft lg:mx-0">
            One QR code on your flyer, or one link in your listing. Visitors give feedback, make an offer or
            apply to rent from their phone, and every offer lands in your
            dashboard ranked against what your seller wants.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Link href="/signup">
              <Button variant="primary">Get started free</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Log in</Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            14-day free trial · No app for visitors · No paper sign-in sheets
          </p>
        </div>
        <HeroShowcase />
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

      <PhoneMockups />

      <DashboardMockup />

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
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brass font-serif text-sm font-medium text-ink">
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
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="font-serif text-3xl font-medium text-ink">
              Not another CRM
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-soft">
              Open Home Hero isn&apos;t trying to replace the CRM you already
              use — it&apos;s built for one moment your CRM was never
              designed for.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-md border border-line">
            <div className="grid grid-cols-2 border-b border-line bg-paper-card text-sm font-medium">
              <div className="px-6 py-3 text-ink-soft">Your CRM</div>
              <div className="border-l border-line px-6 py-3 text-brass">
                Open Home Hero
              </div>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.crm}
                className={`grid grid-cols-2 bg-paper-card ${i > 0 ? "border-t border-line" : ""}`}
              >
                <div className="px-6 py-4 text-sm text-ink-soft">
                  {row.crm}
                </div>
                <div className="border-l border-line px-6 py-4 text-sm text-ink">
                  {row.us}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-ink-soft">
            Export every lead to CSV and drop it into whatever you already
            use — Open Home Hero was never trying to replace it.
          </p>
        </div>
      </section>

      <section className="border-t border-line px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-serif text-3xl font-medium text-ink">
            Simple pricing
          </h2>
          <p className="mt-3 text-ink-soft">
            One plan, every feature. Start with a 14-day free trial.
          </p>
          <div className="group mx-auto mt-10 max-w-4xl">
            <input
              type="checkbox"
              id="agency-pricing-toggle"
              className="peer sr-only"
              aria-label="Show agency pricing"
            />
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="flex flex-col justify-center rounded-md border border-line bg-paper-card p-8">
                <p className="text-sm font-medium text-ink-soft">Monthly</p>
                <p className="mt-2 font-serif text-4xl font-medium text-ink">
                  $39
                  <span className="text-base font-sans font-normal text-ink-soft">
                    /month
                  </span>
                </p>
                <p className="mt-3 text-xs text-ink-soft">For one agent</p>
              </div>
              <div className="flex flex-col justify-center rounded-md border-2 border-brass bg-paper-card p-8">
                <p className="text-sm font-medium text-brass">Yearly · save 2 months</p>
                <p className="mt-2 font-serif text-4xl font-medium text-ink">
                  $390
                  <span className="text-base font-sans font-normal text-ink-soft">
                    /year
                  </span>
                </p>
                <p className="mt-3 text-xs text-ink-soft">For one agent</p>
              </div>
              <label
                htmlFor="agency-pricing-toggle"
                className="flex cursor-pointer flex-col justify-center rounded-md border-2 border-navy bg-navy p-8 text-left shadow-md transition hover:border-brass sm:text-center group-has-[:checked]:border-brass group-has-[:focus-visible]:ring-2 group-has-[:focus-visible]:ring-brass"
              >
                <p className="text-sm font-medium text-brass">Agency · 3+ agents</p>
                <p className="mt-2 font-serif text-4xl font-medium text-paper">
                  $37.05
                  <span className="text-base font-sans font-normal text-navy-soft">
                    /agent/month
                  </span>
                </p>
                <p className="mt-3 text-xs font-medium text-paper">Save up to 15%</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-brass sm:justify-center">
                  Click here for pricing
                  <span
                    aria-hidden="true"
                    className="transition-transform group-has-[:checked]:rotate-180"
                  >
                    ▾
                  </span>
                </p>
              </label>
            </div>

            <div className="mt-6 hidden rounded-md border border-line bg-paper-card p-6 text-left peer-checked:block">
              <h3 className="font-serif text-xl font-medium text-ink">
                Save with an agency plan
              </h3>
              <p className="mt-2 text-sm text-ink-soft">
                Choose how many agents you need and pay one bill, monthly or
                yearly. The more agents, the cheaper each one is — the discount
                applies to every agent. Add or remove licences any time.
              </p>
              <div className="mt-5 overflow-hidden rounded-md border border-line">
                <table className="w-full text-sm">
                  <tbody>
                    {AGENCY_TIERS.map((tier, i) => (
                      <tr
                        key={tier.range}
                        className={i > 0 ? "border-t border-line" : ""}
                      >
                        <td className="px-4 py-2.5 text-ink">{tier.range}</td>
                        <td className="px-4 py-2.5 text-ink-soft">{tier.discount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-5">
                <Link href="/signup?type=agency">
                  <Button variant="primary">Sign up as an agency</Button>
                </Link>
              </div>
              <p className="mt-3 text-xs text-ink-soft">
                Create the agency account, then add each agent&apos;s name and
                email from the Manage page — they get their own login.
              </p>
            </div>
          </div>

          <ul className="mx-auto mt-10 max-w-md space-y-2 text-left">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-ink">
                <span className="mt-0.5 text-brass">✓</span>
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

      <section className="border-t border-line bg-paper-card px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-serif text-3xl font-medium text-ink">
            Frequently asked questions
          </h2>
          <div className="mt-10 divide-y divide-line rounded-md border border-line bg-paper">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-serif text-lg font-medium text-ink hover:text-brass [&::-webkit-details-marker]:hidden">
                  {faq.question}
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-brass transition-transform group-open:rotate-180"
                  >
                    ▾
                  </span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-ink-soft">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-line px-6 py-6 text-center text-xs text-ink-soft">
        <p>© 2026 Open Home Hero</p>
        <p className="mt-2">
          <Link href="/terms" className="underline hover:text-brass">
            Terms
          </Link>
          <span className="mx-2">·</span>
          <Link href="/privacy" className="underline hover:text-brass">
            Privacy
          </Link>
          <span className="mx-2">·</span>
          <Link href="/security" className="underline hover:text-brass">
            Security
          </Link>
          <span className="mx-2">·</span>
          <Link href="/contact" className="underline hover:text-brass">
            Contact
          </Link>
        </p>
      </footer>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Open Home Hero",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "QR code feedback, offers, and rental applications for real estate agents. One QR code per listing — visitors respond from their phone, agents see every lead ranked in one dashboard.",
              offers: {
                "@type": "Offer",
                price: "39",
                priceCurrency: "AUD",
                priceValidUntil: "2026-12-31",
                url: `${SITE_URL}/signup`,
              },
              audience: {
                "@type": "Audience",
                audienceType: "Real estate agents and property managers",
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Open Home Hero",
              url: SITE_URL,
              sameAs: [FACEBOOK_PAGE_URL],
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQS.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            },
          ]),
        }}
      />
    </div>
  );
}
