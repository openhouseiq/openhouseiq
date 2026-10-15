import Link from "next/link";
import type { Metadata } from "next";
import { Wordmark } from "@/components/Wordmark";
import { BusinessDetails } from "@/components/BusinessDetails";
import { CONTACT_EMAIL } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact — Open Home Hero",
  description:
    "Get in touch with Open Home Hero for help, billing questions, agency pricing or privacy requests.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-paper">
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
      </main>
    </div>
  );
}
