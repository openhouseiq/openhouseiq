import Link from "next/link";
import type { Metadata } from "next";
import { ORGANIZATION } from "@/components/JsonLd";
import { FaqList, GuideLayout, Section, faqSchema, type Faq } from "@/components/marketing/GuideLayout";
import { DEFAULT_SITE_URL } from "@/lib/brand";

// Practical guide for agents. Advice only: no statistics, no testimonials, no claims we can't support.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
const PATH = "/open-home-follow-up";
const TITLE = "How to Follow Up After an Open Home: A Guide for Agents";
const DESCRIPTION =
  "A practical guide to following up open home visitors: who to call first, what to say, how to report buyer feedback to your seller, and what to automate.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH, type: "article" },
};

const STEPS = [
  { title: "1. Sort visitors before you leave the property", text: "Split the list into three: ready to act (pre-approved, short timeframe, liked the home), maybe (interested but not ready), and just looking. Call the first group first." },
  { title: "2. Follow up the same day", text: "Interest is highest straight after the open home. A short call or message that afternoon, using something they told you, beats a generic email on Monday." },
  { title: "3. Ask one useful question", text: "“What would stop you making an offer?” tells you more than “What did you think?”. The answer is the feedback your seller needs and the objection you can work on." },
  { title: "4. Report back to your seller with real feedback", text: "Sellers want to know what buyers thought of price, condition, location and layout, not just how many came through. Group the feedback so patterns stand out, and share it before the weekend is over." },
  { title: "5. Keep the maybes warm", text: "Put the maybe group on a simple follow-up plan in your CRM: new listings that fit, the next open home, and a check-in when their timeframe comes round." },
  { title: "6. Ask the sellers in the room", text: "Visitors who also have a home to sell are appraisal leads. Ask the question on your sign-in form and follow them up separately." },
];

const FAQS: Faq[] = [
  { question: "How soon should I follow up after an open home?", answer: "The same day where you can, starting with visitors who are pre-approved, have a short timeframe or told you they liked the home." },
  { question: "What should I say when following up an open home visitor?", answer: "Thank them, mention one thing they told you, and ask one question that moves things forward, such as what would stop them making an offer or whether they would like a second inspection." },
  { question: "How do I give my seller feedback after an open home?", answer: "Collect structured feedback from each visitor (price, condition, location, layout and interest level), group it so patterns stand out, and share a short report the same weekend." },
  { question: "Can follow-up be automated?", answer: "Partly. When visitors sign in with a QR code, their details and feedback can go straight into your CRM, where a follow-up plan can start automatically. The personal call to your best buyers is still worth making yourself." },
];

const STRUCTURED_DATA = [
  { "@context": "https://schema.org", "@type": "Article", headline: TITLE, description: DESCRIPTION, url: `${SITE_URL}${PATH}`, inLanguage: "en-AU", author: ORGANIZATION, publisher: ORGANIZATION, datePublished: "2026-11-25" },
  faqSchema(FAQS),
];

export default function OpenHomeFollowUpPage() {
  return (
    <GuideLayout
      eyebrow="Guide for agents"
      title="How to follow up after an open home"
      intro={<p>The open home is the easy part. What you do in the next 24 hours decides who makes an offer and what you can tell your seller. Here is a simple routine.</p>}
      structuredData={STRUCTURED_DATA}
    >
      {STEPS.map((s, i) => (
        <Section key={s.title} title={s.title} shaded={i % 2 === 0}>
          <p>{s.text}</p>
        </Section>
      ))}
      <Section title="Make the follow-up easier">
        <p>
          Follow-up is only as good as the details you collected. A QR code sign-in gives you readable contact details and each visitor’s feedback on price, condition, location and layout, sent straight to your CRM. See the <Link href="/open-home-sign-in-app" className="underline hover:text-brass">open home sign-in app</Link>, the <Link href="/integrations" className="underline hover:text-brass">CRM integrations</Link>, or start with the free <Link href="/open-home-sign-in-sheet-template" className="underline hover:text-brass">sign-in sheet template</Link>.
        </p>
      </Section>
      <Section title="Open home follow-up questions" shaded>
        <FaqList faqs={FAQS} />
      </Section>
    </GuideLayout>
  );
}
