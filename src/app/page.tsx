import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/Wordmark";
import { HeroPanel } from "@/components/landing/HeroPanel";
import { WorkflowTabs } from "@/components/landing/WorkflowTabs";
import { DEFAULT_SITE_URL, SOCIAL_LINKS } from "@/lib/brand";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

export const metadata: Metadata = {
  title: "Open Home Hero — QR Code Feedback & Offers for Agents",
  description:
    "Instant open home feedback and organised offers from one QR code. No paper sign-in sheets, no app for visitors. Built for Australian real estate agents.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Open Home Hero — QR Code Feedback & Offers for Agents",
    description:
      "One QR code per listing. Visitors leave feedback or submit an offer from their phone — agents see every offer side by side in one dashboard.",
    url: "/",
  },
};

const FAQS = [
  {
    question: "What is Open Home Hero?",
    answer:
      "Open Home Hero is software for real estate agents and property managers that turns a QR code on your flyer or online listing into instant visitor feedback and organised offers at open homes — no app for visitors to download, no paper sign-in sheets.",
  },
  {
    question: "Does Open Home Hero work for rentals?",
    answer:
      "Open Home Hero is built for open homes and sales today. We are rebuilding rental applications so that each state gets its own form that follows that state's rules, with applicants sorted into a shortlist for the landlord. We will start with Queensland and Victoria, and we will announce it when it is ready.",
  },
  {
    question: "Do visitors need to download an app or create an account?",
    answer:
      "No. Visitors scan the listing's QR code and submit feedback or an offer directly from their phone's browser — no app, no account.",
  },
  {
    question: "How much does Open Home Hero cost?",
    answer:
      "Open Home Hero is one plan with every feature included: $39/month or $390/year (two months free). New accounts start with a 14-day free trial.",
  },
  {
    question: "Does it replace my CRM?",
    answer:
      "No, it adds to it. Open Home Hero captures the moment someone walks into an open home or rental inspection, then sends each visitor straight into the CRM you already use, with their feedback or offer attached. It connects with Follow Up Boss, HubSpot, Lofty and Pipedrive today, with VaultRE, Rex and Box+Dice coming soon. Using something else? Export every lead as a CSV and import it.",
  },
];

const CRM_STEPS = [
  {
    title: "Visitor scans the QR code",
    description:
      "They enter their own name, email and phone, then leave feedback or an offer.",
  },
  {
    title: "Open Home Hero captures it",
    description:
      "Interest level, ratings, finance, timeframe and offer terms, all structured by listing.",
  },
  {
    title: "It lands in your CRM",
    description:
      'Within seconds, tagged "Open Home Hero" with the property address. Repeat visitors aren\'t duplicated.',
  },
];

const CRMS_NOW = ["Follow Up Boss", "HubSpot", "Lofty", "Pipedrive"];
const CRMS_SOON = ["VaultRE", "Rex", "Box+Dice"];

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
    us: "Sorts every offer or application by how well it matches that, and you still decide",
  },
];

const INCLUDED = [
  "Unlimited listings and QR codes",
  "Structured visitor feedback & offers",
  "Sends every lead to your CRM",
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

const PRODUCT_CARDS = [
  {
    tag: "01 / OFFERS",
    title: "Every offer, sorted by what your seller wants.",
    body: "Buyers submit an offer from their phone while interest peaks: amount, finance and settlement terms. Each one is matched against your seller's priorities and shown side by side. You still make the call.",
    wide: true,
  },
  {
    tag: "02 / FEEDBACK",
    title: "Structured feedback, not scribbles on a clipboard.",
    body: "Every visitor rates price, condition and location, tells you how interested they are and whether finance is pre-approved. No app, no account.",
    wide: false,
  },
  {
    tag: "03 / REPORTING",
    title: "Proof for your seller, in one click.",
    body: "Show sellers what buyers really thought and every offer on the table. Print the report or save it as a PDF, and export everything as a CSV.",
    wide: false,
  },
  {
    tag: "04 / CRM",
    title: "Makes your CRM better, not redundant.",
    body: "Your CRM already holds the contact. Open Home Hero adds what it was never built to capture: each buyer's feedback and offer, sent into Follow Up Boss, HubSpot, Lofty or Pipedrive within seconds, tagged with the property.",
    wide: true,
  },
];

const METRICS = [
  { value: "< 1 min", label: "For a buyer to give feedback or submit an offer" },
  { value: "4", label: "CRMs connected directly, with CSV export for the rest" },
  { value: "0", label: "Apps or accounts your visitors need" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-line bg-white/85 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
          <Link href="/" className="whitespace-nowrap font-serif text-lg sm:text-xl" aria-label="Open Home Hero home">
            <Wordmark tone="dark" />
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex" aria-label="Main">
            <a href="#product" className="hover:text-ink">Product</a>
            <a href="#workflow" className="hover:text-ink">How it works</a>
            <a href="#crm" className="hover:text-ink">Integrations</a>
            <a href="#pricing" className="hover:text-ink">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-ink hover:text-brass-deep">
              Log in
            </Link>
            <Link href="/signup">
              <Button variant="primary" className="rounded-full px-5">Start free trial</Button>
            </Link>
          </div>
        </div>
      </header>

      <main
        id="top"
        className="px-6 pb-24 pt-20 text-center sm:pt-28"
        style={{ background: "radial-gradient(ellipse 700px 380px at 50% 78%, rgba(176,141,87,0.13), rgba(176,141,87,0) 70%)" }}
      >
        <p className="mx-auto inline-block rounded-full border border-line bg-paper px-4 py-1.5 text-xs tracking-[0.08em] text-brass-deep">
          OFFERS AND FEEDBACK FROM EVERY OPEN HOME
        </p>
        <h1 className="mx-auto mt-6 max-w-4xl text-balance font-serif text-5xl leading-[1.05] text-ink sm:text-6xl lg:text-7xl">
          Turn foot traffic into closed pipeline.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
          One QR code on your flyer. Buyers give structured feedback or submit an offer from their phone, and every
          offer lands in your dashboard side by side, sorted by what your seller wants.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/signup">
            <Button variant="primary" className="px-6 py-3.5 text-base">Start free trial</Button>
          </Link>
          <a href="#workflow">
            <Button variant="secondary" className="px-6 py-3.5 text-base">See how it works →</Button>
          </a>
        </div>
        <p className="mt-5 text-sm text-ink-soft">14-day free trial · Works with your CRM · No app for visitors</p>
        <HeroPanel />
      </main>

      <section aria-label="CRM integrations" className="border-y border-line px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-11 gap-y-4">
          <span className="text-xs tracking-[0.08em] text-ink-soft">CONNECTS WITH</span>
          {CRMS_NOW.map((crm) => (
            <span key={crm} className="text-xl font-bold tracking-tight text-ink-soft">{crm}</span>
          ))}
          <span className="text-xs text-ink-soft">+ CSV export for any other CRM</span>
        </div>
        <div className="mx-auto mt-5 flex max-w-6xl flex-wrap items-center justify-center gap-3">
          <span className="mr-2 text-xs tracking-[0.08em] text-brass-deep">COMING SOON</span>
          {CRMS_SOON.map((crm) => (
            <span key={crm} className="rounded-full border border-dashed border-[#d9d0c3] px-3.5 py-1.5 text-sm font-semibold text-ink-soft">
              {crm}
            </span>
          ))}
        </div>
      </section>

      <section id="product" className="scroll-mt-20 px-6 py-24 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs tracking-[0.08em] text-brass-deep">PRODUCT</p>
          <h2 className="mt-3 max-w-3xl font-serif text-3xl leading-tight text-ink sm:text-4xl">
            Your CRM knows who came. This tells you what they thought, and what they would pay.
          </h2>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {PRODUCT_CARDS.map((card) => (
              <div
                key={card.tag}
                className={`rounded-2xl border border-line bg-paper p-8 ${card.wide ? "lg:col-span-2" : ""}`}
              >
                <p className="text-xs tracking-[0.08em] text-ink-soft">{card.tag}</p>
                <h3 className="mt-3 font-serif text-2xl leading-snug text-ink">{card.title}</h3>
                <p className="mt-3 leading-relaxed text-ink-soft">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="scroll-mt-20 border-y border-line bg-paper px-6 py-24 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs tracking-[0.08em] text-brass-deep">HOW IT WORKS</p>
          <h2 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">From new listing to first offer in three steps.</h2>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Know what every buyer thinks and what they would offer before the seller calls on Monday.
          </p>
          <div className="mt-10">
            <WorkflowTabs />
          </div>
        </div>
      </section>

      <section aria-label="At a glance" className="px-6 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 text-center sm:grid-cols-3">
          {METRICS.map((m) => (
            <div key={m.value}>
              <p className="font-serif text-5xl text-ink">{m.value}</p>
              <p className="mx-auto mt-2 max-w-xs text-sm text-ink-soft">{m.label}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-12 max-w-6xl text-center text-sm text-ink-soft">
          CAPTCHA-protected forms · No app for visitors · Export your data anytime
        </p>
      </section>

      <section id="crm" className="scroll-mt-20 border-t border-line px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brass">
              CRM integration
            </p>
            <h2 className="mt-2 font-serif text-3xl font-medium text-ink">
              Makes your CRM better, not redundant
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-ink-soft">
              Your CRM is where you manage relationships. Open Home Hero fills
              it with what it was never built to capture: every open home
              visitor, what they thought, and what they&apos;d offer, sent
              across automatically. No retyping sign-in sheets, no extra
              subscriptions.
            </p>
          </div>

          <ol className="mt-12 grid gap-4 sm:grid-cols-3">
            {CRM_STEPS.map((step, i) => (
              <li
                key={step.title}
                className="rounded-md border border-line bg-paper-card p-6"
              >
                <p className="font-serif text-2xl text-brass">{i + 1}</p>
                <h3 className="mt-2 font-medium text-ink">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-10 rounded-md border border-line bg-paper-card p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
              Connects with
            </p>
            <ul className="mt-3 flex flex-wrap justify-center gap-x-8 gap-y-2">
              {CRMS_NOW.map((name) => (
                <li key={name} className="font-serif text-lg text-ink">
                  {name}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-ink-soft">
              Coming soon: {CRMS_SOON.join(", ")}. Using something else? Export
              every lead to CSV and import it in seconds.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-md border border-line">
            <div className="grid grid-cols-2 border-b border-line bg-paper-card text-sm font-medium">
              <div className="px-6 py-3 text-ink-soft">Your CRM does</div>
              <div className="border-l border-line px-6 py-3 text-brass">
                Open Home Hero adds
              </div>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.crm}
                className={`grid grid-cols-2 bg-paper-card ${i > 0 ? "border-t border-line" : ""}`}
              >
                <div className="px-6 py-4 text-sm text-ink-soft">{row.crm}</div>
                <div className="border-l border-line px-6 py-4 text-sm text-ink">
                  {row.us}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-20 border-t border-line px-6 py-20">
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
                <p className="text-sm font-medium text-brass">
                  Yearly · save 2 months
                </p>
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
                <p className="text-sm font-medium text-brass">
                  Agency · 3+ agents
                </p>
                <p className="mt-2 font-serif text-4xl font-medium text-paper">
                  $37.05
                  <span className="text-base font-sans font-normal text-navy-soft">
                    /agent/month
                  </span>
                </p>
                <p className="mt-3 text-xs font-medium text-paper">
                  Save up to 15%
                </p>
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
                        <td className="px-4 py-2.5 text-ink-soft">
                          {tier.discount}
                        </td>
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
              <li
                key={item}
                className="flex items-start gap-2 text-sm text-ink"
              >
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

      <section id="start" className="px-6 py-24">
        <div className="mx-auto max-w-5xl rounded-3xl bg-navy px-8 py-16 text-center">
          <h2 className="font-serif text-3xl text-paper sm:text-4xl">Ready to see every offer side by side?</h2>
          <p className="mx-auto mt-4 max-w-xl text-[#d9d0c3]">
            Set up your first listing in minutes. Every feature included in a 14-day free trial.
          </p>
          <Link href="/signup" className="mt-8 inline-block rounded-full bg-brass px-7 py-3.5 font-semibold text-navy hover:opacity-90">
            Start free trial →
          </Link>
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
          <span className="mx-2">·</span>
          <Link href="/open-home-sign-in-app" className="underline hover:text-brass">
            Open home sign-in app
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
                "QR code feedback and offers for real estate agents. One QR code per listing — visitors respond from their phone, agents see every offer side by side in one dashboard.",
              offers: {
                "@type": "Offer",
                price: "39",
                priceCurrency: "AUD",
                priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
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
              sameAs: Object.values(SOCIAL_LINKS).filter(Boolean),
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
