import Link from "next/link";
import type { Metadata } from "next";
import { ORGANIZATION } from "@/components/JsonLd";
import { FaqList, GuideLayout, Section, faqSchema, type Faq } from "@/components/marketing/GuideLayout";
import { DEFAULT_SITE_URL } from "@/lib/brand";

// Free printable open home sign-in sheet. Useful on its own (people search for it),
// and shows honestly where paper falls short and a QR code helps.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
const PATH = "/open-home-sign-in-sheet-template";
const TITLE = "Free Open Home Sign-In Sheet Template (Printable)";
const DESCRIPTION =
  "A free printable open home sign-in sheet for real estate agents, with the columns worth collecting and a privacy note, plus a digital QR code option.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH },
};

const COLUMNS = ["Name", "Mobile", "Email", "Buying or renting soon?", "Pre-approved?", "Also selling?", "Happy to be contacted?"];

const FAQS: Faq[] = [
  { question: "What should an open home sign-in sheet collect?", answer: "Name, mobile and email so you can follow up, plus a few quick questions that tell you who is serious: their timeframe, whether they have finance pre-approval, whether they also have a home to sell, and whether they are happy to be contacted." },
  { question: "Do I need a privacy notice on a sign-in sheet?", answer: "In Australia, collecting personal information generally means telling people who is collecting it and why. A short line at the top of the sheet that says who you are, why you are collecting their details and how to ask for them to be removed is a sensible minimum. Check your agency's privacy policy." },
  { question: "Is a paper sign-in sheet or a QR code better?", answer: "Paper is free and familiar, but handwriting is often hard to read, everyone can see the names above theirs, and the details still need typing into your CRM. A QR code lets each visitor sign in privately on their own phone, so the details arrive clean and can go straight into your CRM." },
  { question: "Can I use this template for rental inspections?", answer: "Yes. Swap “Buying or renting soon?” for the move-in date and number of occupants." },
];

const STRUCTURED_DATA = [
  { "@context": "https://schema.org", "@type": "WebPage", name: TITLE, description: DESCRIPTION, url: `${SITE_URL}${PATH}`, inLanguage: "en-AU", publisher: ORGANIZATION },
  faqSchema(FAQS),
];

export default function SignInSheetTemplatePage() {
  return (
    <GuideLayout
      eyebrow="Free template"
      title="Free open home sign-in sheet template"
      intro={<p>Print this sheet for your next open home. It collects the details worth having, with a privacy line at the top. Press Ctrl+P (Cmd+P on a Mac) to print just the sheet.</p>}
      structuredData={STRUCTURED_DATA}
    >
      <section className="border-t border-line px-6 py-14">
        <div className="mx-auto max-w-5xl rounded-md border border-line bg-white p-6 text-ink">
          <h2 className="font-serif text-2xl font-medium">Open home sign-in</h2>
          <p className="mt-2 text-sm">Property: ______________________________ &nbsp; Date: ____________ &nbsp; Agent: ____________________</p>
          <p className="mt-2 text-xs text-ink-soft">
            Your details are collected by the agent named above to follow up about this and similar properties. Ask the agent at any time to have them removed.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr>{COLUMNS.map((c) => <th key={c} className="border border-ink/40 px-2 py-2 text-left font-semibold">{c}</th>)}</tr>
              </thead>
              <tbody>
                {Array.from({ length: 12 }, (_, r) => (
                  <tr key={r}>{COLUMNS.map((c) => <td key={c} className="h-9 border border-ink/40 px-2" />)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <Section title="What to collect, and why" shaded>
        <p><strong className="text-ink">Name, mobile and email</strong> so you can follow up the same day. Mobile is the one most worth getting right.</p>
        <p><strong className="text-ink">Buying or renting soon, pre-approval and timeframe</strong> tell you who to call first.</p>
        <p><strong className="text-ink">Also selling?</strong> turns a buyer into an appraisal lead.</p>
        <p><strong className="text-ink">Happy to be contacted?</strong> keeps your follow-up welcome rather than unwanted.</p>
      </Section>
      <Section title="When paper stops working">
        <p>
          Busy open homes queue at the clipboard, handwriting is hard to read on Monday, and every name has to be typed into your CRM. With a QR code, each visitor signs in on their own phone, leaves feedback on price, condition, location and layout, and lands in your CRM straight away. See how it works on the <Link href="/open-home-sign-in-app" className="underline hover:text-brass">open home sign-in app</Link> page.
        </p>
      </Section>
      <Section title="Sign-in sheet questions" shaded>
        <FaqList faqs={FAQS} />
      </Section>
    </GuideLayout>
  );
}
