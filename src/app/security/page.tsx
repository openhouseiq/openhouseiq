import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { CONTACT_EMAIL } from "@/lib/brand";

export const metadata = { title: "Security — Open Home Hero" };

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-3xl items-center px-6 py-6">
        <Link href="/" className="font-serif text-xl tracking-tight">
          <Wordmark tone="dark" />
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20">
        <h1 className="font-serif text-3xl font-medium text-ink">Security</h1>
        <p className="mt-2 text-sm text-ink-soft">Last updated 13 October 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink">
          <section>
            <p>
              An overview of how Open Home Hero protects agent and visitor data.
              If you need more detail for a vendor security review, contact{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-brass underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              Encryption in transit and at rest
            </h2>
            <p className="mt-2">
              All traffic to and from Open Home Hero is encrypted over HTTPS/TLS.
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
              Every table has database-level Row Level Security (RLS) turned
              on, so an agent&apos;s listings, feedback, offers and
              applications are only readable by that agent or their agency,
              as a second layer behind the application&apos;s own checks.
              Visitors who scan a QR code only ever receive the few details
              needed to show the visit page (address, agent name and contact
              email). Seller and landlord preferences, and everything
              visitors submit, stay behind the agent&apos;s login. The
              server also checks who is signed in on every request.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              Authentication
            </h2>
            <p className="mt-2">
              Passwords are hashed and never stored in plain text, using
              Supabase Auth&apos;s industry-standard authentication, and must
              be at least 12 characters. Session tokens are short-lived and
              refreshed automatically. Agents can turn on two-step login with
              an authenticator app; it is required for administrator access.
              Deleting an account asks for the password again.
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
              through or get stored on Open Home Hero&apos;s servers.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              Abuse and spam protection
            </h2>
            <p className="mt-2">
              Public visitor forms (feedback, offers and rental
              applications) are protected by Cloudflare Turnstile, a
              privacy-friendly CAPTCHA, plus server-side rate limiting and
              strict checking of every field to prevent automated abuse.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              Application security
            </h2>
            <p className="mt-2">
              The site sends browser security headers (including a content
              security policy and protection against being embedded in
              other sites). Agency invitations only take effect when the invited person
              accepts, so an agency can&apos;t change another person&apos;s
              account or subscription without their agreement. Software
              dependencies are checked against known vulnerabilities before each release.
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
              <Link href="/privacy" className="text-brass underline">
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
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-brass underline">
                {CONTACT_EMAIL}
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
