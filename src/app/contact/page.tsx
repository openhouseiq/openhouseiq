import Link from "next/link";
import type { Metadata } from "next";
import { Wordmark } from "@/components/Wordmark";
import { BusinessDetails } from "@/components/BusinessDetails";
import { CONTACT_EMAIL, DEFAULT_SITE_URL } from "@/lib/brand";
import { JsonLd, ORGANIZATION } from "@/components/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

export const metadata: Metadata = {
  title: "Contact — Open Home Hero",
  description:
    "Contact Open Home Hero for help setting up listings and QR codes, billing and agency pricing, privacy and data requests, or security questions.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-paper">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact Open Home Hero",
          url: `${SITE_URL}/contact`,
          inLanguage: "en-AU",
          mainEntity: {
            ...ORGANIZATION,
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              email: CONTACT_EMAIL,
              areaServed: "AU",
              availableLanguage: "English",
            },
          },
        }}
      />
      <header className="mx-auto flex max-w-3xl items-center px-6 py-6">
        <Link href="/" className="font-serif text-xl tracking-tight">
          <Wordmark tone="dark" />
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20">
        <h1 className="font-serif text-3xl font-medium text-ink">Contact us</h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Questions about your account, billing, agency pricing or how to set up a
          listing? Email us and a person will reply, usually within one business
          day.
        </p>

        <div className="mt-8 rounded-md border border-line bg-paper-card p-6">
          <p className="text-sm text-ink-soft">Email</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mt-1 block font-serif text-xl text-brass underline"
          >
            {CONTACT_EMAIL}
          </a>
          <p className="mt-4 text-sm text-ink-soft">
            For account help, mention the email address you signed up with. Never
            send your password.
          </p>
        </div>

        <div className="mt-8 grid gap-6 text-sm text-ink-soft sm:grid-cols-2">
          <div>
            <h2 className="font-serif text-lg font-medium text-ink">Common requests</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Help setting up a listing or QR code</li>
              <li>Billing and invoices</li>
              <li>Agency pricing for more than 20 agents</li>
              <li>Privacy requests, including deleting your data</li>
              <li>Reporting a security concern (see our <Link href="/security" className="text-brass underline">security page</Link>)</li>
            </ul>
          </div>
          <div>
            <h2 className="font-serif text-lg font-medium text-ink">Business details</h2>
            <BusinessDetails className="mt-2 space-y-0.5" />
          </div>
        </div>
        <section className="mt-10 text-sm leading-relaxed text-ink-soft">
          <h2 className="font-serif text-lg font-medium text-ink">Quick answers before you email</h2>
          <dl className="mt-3 space-y-4">
            <div>
              <dt className="font-medium text-ink">How do I get started?</dt>
              <dd>
                <Link href="/signup" className="text-brass underline">Create an account</Link>{" "}
                and add your first listing. Each listing gets its own QR code to put on your
                open home flyer, or a link to paste into your online listing. New accounts
                start with a 14-day free trial.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Do my open home visitors need an app?</dt>
              <dd>
                No. Visitors scan the QR code and leave feedback or make an offer in their
                phone&apos;s browser, with no app to download and no account to create.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Can I see it before signing up?</dt>
              <dd>
                Yes. The{" "}
                <Link href="/preview" className="text-brass underline">preview page</Link>{" "}
                shows what visitors see and how feedback and offers arrive in your dashboard.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink">Does it replace my CRM?</dt>
              <dd>
                No. Open Home Hero captures open home feedback and offers, and you can export
                every lead as a CSV to import into the CRM you already use.
              </dd>
            </div>
            <div>
              <dt className="font-medium text-ink">How do I delete my data?</dt>
              <dd>
                Email us from the address you signed up with. Our{" "}
                <Link href="/privacy" className="text-brass underline">privacy policy</Link>{" "}
                explains what we keep and for how long.
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  );
}
