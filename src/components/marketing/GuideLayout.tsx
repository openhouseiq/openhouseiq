import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/Wordmark";
import { JsonLd } from "@/components/JsonLd";

// Shared shell for public search pages (integrations, templates, guides).
// Same header and footer as /for-rex-users so every public page looks the same.

export type Faq = { question: string; answer: string };

export function GuideLayout({
  eyebrow,
  title,
  intro,
  children,
  structuredData,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  children: ReactNode;
  structuredData: Record<string, unknown>[];
}) {
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
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brass">{eyebrow}</p>
          <h1 className="mt-3 font-serif text-4xl font-medium leading-tight text-ink sm:text-5xl">{title}</h1>
          <div className="mx-auto mt-5 max-w-2xl text-lg text-ink-soft">{intro}</div>
        </section>
        {children}
        <section className="border-t border-line bg-navy px-6 py-16 text-center">
          <h2 className="font-serif text-3xl font-medium text-paper">Try it at your next open home</h2>
          <p className="mx-auto mt-3 max-w-xl text-navy-soft">
            One QR code per listing. Visitors sign in and leave feedback on their own phone. $39 a month after a 14-day free trial.
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
          <Link href="/open-home-sign-in-app" className="underline hover:text-brass">Open home sign-in app</Link>
          <span className="mx-2">·</span>
          <Link href="/integrations" className="underline hover:text-brass">CRM integrations</Link>
          <span className="mx-2">·</span>
          <Link href="/open-home-sign-in-sheet-template" className="underline hover:text-brass">Sign-in sheet template</Link>
          <span className="mx-2">·</span>
          <Link href="/open-home-follow-up" className="underline hover:text-brass">Open home follow-up</Link>
          <span className="mx-2">·</span>
          <Link href="/contact" className="underline hover:text-brass">Contact</Link>
        </p>
      </footer>

      <JsonLd data={structuredData} />
    </div>
  );
}

export function Section({ title, children, shaded }: { title: string; children: ReactNode; shaded?: boolean }) {
  return (
    <section className={`border-t border-line px-6 py-14 ${shaded ? "bg-paper-card" : ""}`}>
      <div className="mx-auto max-w-3xl">
        <h2 className="font-serif text-3xl font-medium text-ink">{title}</h2>
        <div className="mt-6 space-y-4 leading-relaxed text-ink-soft">{children}</div>
      </div>
    </section>
  );
}

export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="space-y-3">
      {faqs.map((faq) => (
        <details key={faq.question} className="rounded-md border border-line bg-paper p-5">
          <summary className="cursor-pointer font-medium text-ink">{faq.question}</summary>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{faq.answer}</p>
        </details>
      ))}
    </div>
  );
}

export const faqSchema = (faqs: Faq[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
});
