import Link from "next/link";
import type { Metadata } from "next";
import { ORGANIZATION } from "@/components/JsonLd";
import { FaqList, GuideLayout, Section, faqSchema, type Faq } from "@/components/marketing/GuideLayout";
import { DEFAULT_SITE_URL } from "@/lib/brand";

// CRM integrations page. Only list CRMs that are live in the product. Keep "coming soon"
// in step with the home page. Never claim an integration that does not exist.

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
const PATH = "/integrations";
const TITLE = "Open Home CRM Integrations: Follow Up Boss, HubSpot, Lofty";
const DESCRIPTION =
  "Send every open home visitor straight into Follow Up Boss, HubSpot, Lofty or Pipedrive with their feedback attached. Rex and other CRMs export by CSV.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH },
};

const CRMS = [
  { id: "follow-up-boss", name: "Follow Up Boss", text: "Each open home visitor arrives in Follow Up Boss as a person with their phone and email, tagged “Open Home Hero” plus “Open home feedback” or “Offer”, with what they told you attached. Return visitors are matched to the existing person instead of creating a duplicate, so your follow-up action plans start from clean data." },
  { id: "hubspot", name: "HubSpot", text: "Visitors become HubSpot contacts, with their feedback or offer added as a note on the contact. A visitor whose email is already in HubSpot gets the note on their existing contact. Agents and agencies already running HubSpot can start follow-up sequences from real open home interest instead of a paper list typed in on Monday." },
  { id: "lofty", name: "Lofty", text: "Open home visitors land in Lofty as leads with their contact details, the property and their feedback, ready for your Lofty follow-up. Repeat visitors are matched, not duplicated." },
  { id: "pipedrive", name: "Pipedrive", text: "Each visitor is created in Pipedrive as a person with the property and their feedback, so open home interest shows up in the same place you track the rest of your pipeline." },
];

const FAQS: Faq[] = [
  { question: "Which CRMs does Open Home Hero connect to?", answer: "Follow Up Boss, HubSpot, Lofty and Pipedrive today. VaultRE, Rex and Box+Dice are coming soon. Agents on any other CRM can export every visitor as a CSV spreadsheet and import it." },
  { question: "How fast do visitors reach my CRM?", answer: "Within seconds of the visitor submitting the form at the open home, tagged “Open Home Hero” with the property address." },
  { question: "Will repeat visitors create duplicates?", answer: "No. A visitor who comes back to another open home is matched to the record already in your CRM." },
  { question: "I use Rex. Can I still use Open Home Hero?", answer: "Yes. Rex stays your CRM. Today you export visitors as a CSV and import them into Rex; a direct Rex connection is in the works." },
  { question: "Do I need a developer to set it up?", answer: "No. You connect your CRM from the Open Home Hero settings, then every new listing sends its visitors there." },
];

const STRUCTURED_DATA = [
  { "@context": "https://schema.org", "@type": "WebPage", name: TITLE, description: DESCRIPTION, url: `${SITE_URL}${PATH}`, inLanguage: "en-AU", publisher: ORGANIZATION },
  faqSchema(FAQS),
];

export default function IntegrationsPage() {
  return (
    <GuideLayout
      eyebrow="CRM integrations"
      title="Open home visitors, straight into your CRM"
      intro={<p>Visitors scan the listing’s QR code and sign in on their own phone. Open Home Hero sends each one to your CRM within seconds, with their feedback or offer attached and repeat visitors matched.</p>}
      structuredData={STRUCTURED_DATA}
    >
      {CRMS.map((crm, i) => (
        <Section key={crm.id} title={`${crm.name} open home integration`} shaded={i % 2 === 0}>
          <p id={crm.id}>{crm.text}</p>
        </Section>
      ))}
      <Section title="Rex and other CRMs">
        <p>
          Rex users keep Rex and export visitors as a CSV spreadsheet; see <Link href="/for-rex-users" className="underline hover:text-brass">Open Home Hero for Rex users</Link>. VaultRE, Rex and Box+Dice connections are coming soon. Any other CRM can import the same CSV.
        </p>
      </Section>
      <Section title="Questions about CRM integrations" shaded>
        <FaqList faqs={FAQS} />
      </Section>
    </GuideLayout>
  );
}
