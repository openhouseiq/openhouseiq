"use client";

import { useState } from "react";

type Faq = { question: string; answer: string };

const CRM_FAQS: Faq[] = [
  {
    question: "Which CRMs can I connect?",
    answer:
      'Available now: Follow Up Boss, HubSpot, Lofty and Pipedrive.\nComing soon: VaultRE, Rex, AgentBox and Box+Dice. They show as "coming soon" in Settings → Connect your CRM and switch on as each one approves us.\nYou can connect one CRM at a time. If you\'re part of an agency, the agency owner connects it once for every agency listing.',
  },
  {
    question: "How do I connect my CRM?",
    answer:
      '1. Go to Settings → Connect your CRM.\n2. Choose your CRM from the "Which CRM do you use?" list.\n3. Copy your key from your CRM (see "Where do I find my CRM key?" below) and paste it into the box.\n4. Click Connect. We check the key with your CRM straight away, and you\'ll see "Connected" if it worked.\nThat\'s it: from then on, every open home visitor who leaves their details goes into your CRM automatically.',
  },
  {
    question: "Where do I find my CRM key?",
    answer:
      "Follow Up Boss: Admin → API → Create API Key (account owner or admin only).\nHubSpot: Development → Keys → Service keys → Create service key. Add the scopes crm.objects.contacts.read and crm.objects.contacts.write, then copy the key.\nLofty: Settings → Integrations → API, then create and copy an API key.\nPipedrive: click your profile picture → Personal preferences → API, then copy your personal API token.\nKeep your key private, like a password. Only paste it into Open Home Hero's Settings.",
  },
  {
    question: "What gets sent to my CRM?",
    answer:
      "Each visitor's name, email and phone, plus their feedback (interest level, ratings, timeframe, finance, comments) or their offer (amount, finance, settlement, conditions, notes), tagged \"Open Home Hero\" with the property address.\nIt's sent within seconds of the visitor submitting. Anonymous feedback isn't sent, because there are no contact details. In Follow Up Boss, HubSpot and Pipedrive, a repeat visitor with the same email is added to their existing contact rather than creating a duplicate.",
  },
  {
    question: "What if my CRM is down, or my key stops working?",
    answer:
      "If your CRM is busy or offline, we keep trying for up to a day, so nothing is lost. If your key is removed or expires, Settings shows a warning and we hold your visitors until you reconnect, then send them. You can also export everything as a CSV from any listing at any time.",
  },
  {
    question: "How do I disconnect or switch CRMs?",
    answer:
      "Go to Settings → Connect your CRM and click Disconnect. Visitors already sent stay in your CRM. Then choose the new CRM from the list and connect it.",
  },
];

const GENERAL_FAQS: Faq[] = [
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
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 font-serif text-lg font-medium text-ink">
          Connecting your CRM
        </h3>
        <FaqList
          faqs={CRM_FAQS}
          openKey={openKey}
          setOpenKey={setOpenKey}
          group="crm"
        />
      </div>
      <div>
        <h3 className="mb-3 font-serif text-lg font-medium text-ink">
          Using Open Home Hero
        </h3>
        <FaqList
          faqs={GENERAL_FAQS}
          openKey={openKey}
          setOpenKey={setOpenKey}
          group="general"
        />
      </div>
    </div>
  );
}
