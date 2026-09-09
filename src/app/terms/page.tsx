import Link from "next/link";

export const metadata = { title: "Terms of Service — OpenHouseIQ" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-3xl items-center px-6 py-6">
        <Link href="/" className="font-serif text-xl tracking-tight">
          <span className="text-ink">OpenHouse</span>
          <span className="text-brass">IQ</span>
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-20">
        <h1 className="font-serif text-3xl font-medium text-ink">Terms of Service</h1>
        <p className="mt-2 text-sm text-ink-soft">Last updated 9 September 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-ink">
          <section>
            <h2 className="font-serif text-lg font-medium text-ink">1. Agreement</h2>
            <p className="mt-2">
              These Terms of Service (&quot;Terms&quot;) govern your use of
              OpenHouseIQ (the &quot;Service&quot;), operated by OpenHouseIQ
              (&quot;we&quot;, &quot;us&quot;). By creating an account or using
              the Service, you agree to these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              2. The Service
            </h2>
            <p className="mt-2">
              OpenHouseIQ lets real estate agents create property listings,
              generate a QR code for each listing, and collect visitor feedback
              and offers submitted through a public web form at an open house.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              3. Accounts and trial
            </h2>
            <p className="mt-2">
              New accounts include a 14-day free trial. No payment is required to
              start a trial. If you do not subscribe before the trial ends, your
              account moves to read-only mode: you can still view existing
              listings, feedback, and offers, but cannot create new listings
              until you subscribe.
            </p>
            <p className="mt-2">
              You are responsible for keeping your login credentials secure and
              for all activity under your account.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              4. Subscriptions and billing
            </h2>
            <p className="mt-2">
              Paid subscriptions are billed monthly or annually in advance
              through our payment processor, Stripe. We do not store your card
              details. Subscriptions renew automatically until cancelled. You
              can cancel or manage your subscription at any time from the
              Billing section of your account, which opens Stripe&apos;s secure
              billing portal.
            </p>
            <p className="mt-2">
              Fees are non-refundable except where required by law.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              5. Visitor-submitted content
            </h2>
            <p className="mt-2">
              Feedback and offers submitted by open house visitors are provided
              by those visitors, not by you, and are made available to you as
              the agent for the relevant listing. You are responsible for how
              you use that information, including complying with any
              applicable privacy or real estate regulations in your
              jurisdiction.
            </p>
            <p className="mt-2">
              Visitors provide their contact details to enquire about that
              specific property. You agree to only use those details for
              purposes reasonably related to that enquiry, and not for
              unrelated marketing or to add visitors to a mailing list
              without their separate consent, consistent with the Spam Act
              2003 (Cth) and equivalent laws in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              6. Acceptable use
            </h2>
            <p className="mt-2">
              You agree not to use the Service to post unlawful, misleading, or
              fraudulent listings, to harvest visitor data for unrelated
              purposes, or to attempt to disrupt or gain unauthorized access to
              the Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              7. Availability and liability
            </h2>
            <p className="mt-2">
              The Service is provided &quot;as is.&quot; We aim for high availability but
              do not guarantee uninterrupted access. To the maximum extent
              permitted by law, OpenHouseIQ is not liable for indirect or
              consequential losses, including lost leads or lost sales,
              arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              8. Termination
            </h2>
            <p className="mt-2">
              You may stop using the Service and cancel your subscription at
              any time. We may suspend or terminate accounts that breach these
              Terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">
              9. Changes to these Terms
            </h2>
            <p className="mt-2">
              We may update these Terms from time to time. Continued use of the
              Service after changes take effect means you accept the updated
              Terms.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg font-medium text-ink">10. Contact</h2>
            <p className="mt-2">
              Questions about these Terms can be sent to{" "}
              <a href="mailto:mick_orr@hotmail.com" className="text-pine underline">
                mick_orr@hotmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
