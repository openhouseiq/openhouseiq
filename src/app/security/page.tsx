import Link from "next/link";

export const metadata = { title: "Security — OpenHouseIQ" };

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-3xl items-center px-6 py-6">
        <Link href="/" className="font-serif text-xl tracking-tight">
          <span className="text-ink">OpenHouse</span>
          <span className="text-brass">IQ</span>
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20">
        <h1 className="font-serif text-3xl font-medium text-ink">Security</h1>
        <p className="mt-2 text-sm text-ink-soft">Last updated 9 September 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink">
          <section>
            <p>
              An overview of how OpenHouseIQ protects agent and visitor data.
              If you need more detail for a vendor security review, contact{" "}
              <a href="mailto:mick_orr@hotmail.com" className="text-pine underline">
                mick_orr@hotmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              Encryption in transit and at rest
            </h2>
            <p className="mt-2">
              All traffic to and from OpenHouseIQ is encrypted over HTTPS/TLS.
              Data at rest — agent accounts, listings, feedback, and offers —
              is stored in a managed Postgres database with encryption at
              rest, provided by our infrastructure partner Supabase.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              Per-agent data isolation
            </h2>
            <p className="mt-2">
              Every table is protected by database-level Row Level Security
              (RLS) policies, not just application logic. An agent&apos;s
              listings, feedback, and offers are only ever readable by that
              agent — enforced at the database itself, so a bug in the
              application code can&apos;t leak one agent&apos;s data to
              another.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              Authentication
            </h2>
            <p className="mt-2">
              Passwords are hashed and never stored in plain text, using
              Supabase Auth&apos;s industry-standard authentication. Session
              tokens are short-lived and refreshed automatically.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              Payment data
            </h2>
            <p className="mt-2">
              Subscription payments are handled entirely by Stripe, a PCI DSS
              Level 1 certified payment processor. Card details are entered
              directly into Stripe&apos;s hosted checkout — they never pass
              through or get stored on OpenHouseIQ&apos;s servers.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              Abuse and spam protection
            </h2>
            <p className="mt-2">
              Public visitor forms (feedback and offers) are protected by
              Cloudflare Turnstile, a privacy-friendly CAPTCHA, plus
              server-side rate limiting to prevent automated abuse.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              Data deletion
            </h2>
            <p className="mt-2">
              Agents can permanently delete their account and all associated
              data at any time from Settings. Visitor feedback or offers can
              be deleted individually by the listing agent on request. See
              our{" "}
              <Link href="/privacy" className="text-pine underline">
                Privacy Policy
              </Link>{" "}
              for details.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              Responsible disclosure
            </h2>
            <p className="mt-2">
              If you believe you&apos;ve found a security vulnerability,
              please report it to{" "}
              <a href="mailto:mick_orr@hotmail.com" className="text-pine underline">
                mick_orr@hotmail.com
              </a>{" "}
              before disclosing it publicly. We&apos;ll acknowledge reports
              within 2 business days.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
