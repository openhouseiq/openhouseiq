"use client";

import { useState } from "react";

const FAQS: { question: string; answer: string }[] = [
  {
    question: "How do visitors submit feedback, offers, or rental applications?",
    answer:
      "Each listing gets its own QR code from its detail page. Print it and display it at the open house or rental inspection — visitors scan it with their phone camera, no app or account needed.",
  },
  {
    question: "How is the match percentage on offers and applicants calculated?",
    answer:
      "It compares the offer or application against the preferences you set on the listing (seller preferences for sales, landlord preferences for rentals). Anything you mark as \"required\" or \"not allowed\" that isn't met shows up as a missing requirement instead of a percentage.",
  },
  {
    question: "What's the difference between a sale listing and a rental listing?",
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

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-line">
      {FAQS.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={faq.question} className="py-3 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 text-left text-sm font-medium text-ink"
            >
              {faq.question}
              <span className="shrink-0 text-ink-soft">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen ? (
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {faq.answer}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
