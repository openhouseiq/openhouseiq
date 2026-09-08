import Link from "next/link";

export const metadata = { title: "Privacy Policy — OpenHouseIQ" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-3xl items-center px-6 py-6">
        <Link href="/" className="font-serif text-xl tracking-tight">
          <span className="text-ink">OpenHouse</span>
          <span className="text-brass">IQ</span>
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20">
        <h1 className="font-serif text-3xl font-medium text-ink">Privacy Policy</h1>
        <p className="mt-2 text-sm text-ink-soft">Last updated 8 September 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink">
          <section>
            <p>
              OpenHouseIQ (&quot;we&quot;, &quot;us&quot;) respects your
              privacy. This policy explains what information we collect, why,
              and how it&apos;s handled, consistent with the Australian
              Privacy Principles under the Privacy Act 1988 (Cth).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              1. Information we collect
            </h2>
            <p className="mt-2">
              <span className="font-medium">Agent accounts:</span> name, email,
              phone number, and password (stored securely, never in plain
              text), plus listing details you create.
            </p>
            <p className="mt-2">
              <span className="font-medium">Open house visitors:</span> when
              someone submits feedback or an offer through a listing&apos;s public
              page, we collect the information they enter — typically name,
              email, phone, and their comments or offer details — and share it
              with the agent for that listing.
            </p>
            <p className="mt-2">
              <span className="font-medium">Billing:</span> if you subscribe,
              payment is handled entirely by Stripe. We receive confirmation of
              your subscription status but never see or store your full card
              details.
            </p>
            <p className="mt-2">
              <span className="font-medium">Technical data:</span> basic log
              and security data (such as IP address and browser type) used to
              keep the Service secure and prevent spam submissions, including
              through our CAPTCHA provider, Cloudflare Turnstile.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              2. How we use information
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>To operate and maintain your account and listings</li>
              <li>To deliver visitor feedback and offers to the relevant agent</li>
              <li>To process subscription payments and manage billing</li>
              <li>To secure the Service against spam and abuse</li>
              <li>To send essential account and service emails</li>
            </ul>
            <p className="mt-2">
              We do not sell personal information, and we do not use visitor
              feedback for advertising.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              3. Who we share it with
            </h2>
            <p className="mt-2">
              We use a small number of service providers to run OpenHouseIQ:
              Supabase (database, authentication, and file storage), Stripe
              (payments), Cloudflare (CAPTCHA/spam protection), and Netlify
              (hosting). Each processes data only as needed to provide their
              service to us.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              4. Data retention
            </h2>
            <p className="mt-2">
              We retain account and listing data for as long as your account is
              active. You can request deletion of your account and associated
              data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              5. Your rights
            </h2>
            <p className="mt-2">
              You can access, correct, or request deletion of your personal
              information at any time. Agents can update their profile from
              Settings; visitors who submitted feedback or an offer can contact
              the listing agent directly, or contact us to have their
              submission removed.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              6. Security
            </h2>
            <p className="mt-2">
              We use industry-standard measures — encrypted connections,
              database-level access controls (row-level security), and
              CAPTCHA verification on public forms — to protect the
              information we hold.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              7. Changes to this policy
            </h2>
            <p className="mt-2">
              We may update this policy from time to time. Material changes
              will be reflected by updating the date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">8. Contact</h2>
            <p className="mt-2">
              For privacy questions or requests, contact{" "}
              <a href="mailto:hello@openhouseiq.com.au" className="text-pine underline">
                hello@openhouseiq.com.au
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
