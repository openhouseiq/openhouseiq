"use client";

import { useState } from "react";

type Faq = { question: string; answer: string };

const CRM_FAQ: Faq = {
  question: "How do I connect my CRM?",
  answer:
    'Open Home Hero can send every open home visitor who leaves their details straight into your CRM: their name, email and phone, plus their feedback or offer, tagged "Open Home Hero" with the property address.\n\nAvailable now: Follow Up Boss, HubSpot, Lofty and Pipedrive. Coming soon: VaultRE, Rex, AgentBox and Box+Dice.\n\nTo connect:\n1. Go to Settings → Profile → Connect your CRM.\n2. Choose your CRM from the "Which CRM do you use?" list.\n3. Copy your key from your CRM and paste it into the box:\n   • Follow Up Boss: Admin → API → Create API Key (account owner or admin).\n   • HubSpot: Development → Keys → Service keys → Create service key, with the scopes crm.objects.contacts.read and crm.objects.contacts.write.\n   • Lofty: Settings → Integrations → API → create an API key.\n   • Pipedrive: profile picture → Personal preferences → API → copy your personal API token.\n4. Click Connect. You\'ll see "Connected" once your CRM accepts the key.\n\nGood to know: you can connect one CRM at a time, and agency owners connect once for every agency listing. Anonymous feedback isn\'t sent. If your CRM is offline we keep retrying, and if a key stops working we hold your visitors until you reconnect. To switch, click Disconnect and connect the new one. Keep your key private, like a password.',
};

const FAQS: Faq[] = [
  CRM_FAQ,
  {
    question:
      "How do visitors submit feedback, offers, or rental applications?",
    answer:
      "Each listing gets its own QR code from its detail page. Copy it onto your flyer, or attach the link to your online listing — visitors scan or tap it on their phone, no app or account needed.",
  },
  {
    question:
      "How is the match percentage on offers and applicants calculated?",
    answer:
      'It compares the offer or application against the preferences you set on the listing (seller preferences for sales, landlord preferences for rentals). Anything you mark as "required" or "not allowed" that isn\'t met shows up as a missing requirement instead of a percentage.',
  },
  {
    question:
      "What's the difference between a sale listing and a rental listing?",
    answer:
      "Sale listings collect offers against seller preferences (price, settlement, finance, inspection). Rental listings collect pre-qualification applications against landlord preferences (pets, lease term, smoking, proof of income) — it's a shortlisting tool for you, not a replacement for the RTA tenancy application.",
  },
  {
    question: "How do I turn on notifications?",
    answer:
      "Go to Settings → Notifications. Email is on by default and can be toggled off. Push notifications need to be enabled per device — on iPhone this only works after adding the site to your Home Screen via Safari and opening it from there.",
  },
  {
    question: "What happens when my free trial ends?",
    answer:
      "Your subscription automatically continues using the payment method on file, billed at the plan you signed up for. You can manage or cancel anytime from Settings → Billing.",
  },
  {
    question: "Can I delete a listing, or my whole account?",
    answer:
      "Yes — delete a single listing from its detail page. To delete your entire account (all listings, photos, feedback, offers, and applicants), use Settings → Delete your account. Both are permanent and can't be undone.",
  },
];

function FaqList({
  faqs,
  openKey,
  setOpenKey,
  group,
}: {
  faqs: Faq[];
  openKey: string | null;
  setOpenKey: (key: string | null) => void;
  group: string;
}) {
  return (
    <div className="divide-y divide-line">
      {faqs.map((faq) => {
        const key = `${group}:${faq.question}`;
        const isOpen = openKey === key;
        return (
          <div key={key} className="py-3 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => setOpenKey(isOpen ? null : key)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 text-left text-sm font-medium text-ink"
            >
              {faq.question}
              <span className="shrink-0 text-ink-soft">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen ? (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {faq.answer}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function FAQSection() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  return (
    <FaqList
      faqs={FAQS}
      openKey={openKey}
      setOpenKey={setOpenKey}
      group="faq"
    />
  );
}
