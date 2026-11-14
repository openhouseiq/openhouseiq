"use client";

import { useState } from "react";

// Three-step workflow on the home page. Each tab shows a short explanation
// and a small sample of what the agent sees at that step (sample data).

const TABS = [
  {
    label: "01 / Create a listing",
    title: "Create a listing, get a QR code.",
    body: "Add the address, price and details. Open Home Hero generates a QR code and link for that listing the moment you save it. Copy it onto your flyer or attach it to your online listing.",
    points: ["Unlimited listings", "QR code + link"],
  },
  {
    label: "02 / Feedback & offers",
    title: "Collect feedback and offers on the spot.",
    body: "Buyers scan the QR code on their own phone, with no app to download. They rate the property, say how interested they are, and can submit an offer with finance and settlement terms before they leave the driveway.",
    points: ["No app for visitors", "Offers on the spot"],
  },
  {
    label: "03 / Follow up",
    title: "Follow up from your CRM, with seller proof ready.",
    body: "The moment a buyer submits, Open Home Hero sends them to your CRM tagged with the property address and updates your dashboard. Your seller report is ready to print or export.",
    points: ["Automatic CRM sync", "Printable reports"],
  },
];

function Sample({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className="rounded-xl border border-line bg-white p-5">
        <p className="text-sm font-semibold text-ink">24 Grandview Terrace</p>
        <p className="text-sm text-ink-soft">$1,250,000 · 4 bd · 2 ba · 2 car</p>
        <div className="mt-4 flex items-center gap-4">
          <div className="grid h-20 w-20 grid-cols-5 gap-0.5 rounded-md border border-line p-1.5" aria-hidden="true">
            {Array.from({ length: 25 }, (_, i) => (
              <span key={i} className={[0, 1, 3, 5, 6, 8, 11, 12, 13, 16, 18, 19, 20, 22, 24].includes(i) ? "bg-navy" : ""} />
            ))}
          </div>
          <div>
            <p className="text-xs text-green-700">● Listing saved · QR code ready</p>
            <span className="mt-2 inline-block rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-paper">
              Copy to flyer
            </span>
          </div>
        </div>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-line bg-white p-5">
          <p className="text-sm font-semibold text-ink">How interested are you?</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-line px-3 py-1.5 text-ink-soft">Considering</span>
            <span className="rounded-full bg-navy px-3 py-1.5 font-semibold text-paper">Very interested</span>
            <span className="rounded-full border border-line px-3 py-1.5 text-ink-soft">Ready to make an offer</span>
          </div>
        </div>
        <div className="rounded-xl border border-brass/40 bg-white p-5 text-sm">
          <p className="text-xs tracking-[0.08em] text-brass-deep">NEW OFFER</p>
          <p className="mt-1 font-semibold text-ink">Alex T. · $1,285,000</p>
          <p className="text-ink-soft">Finance: Pre-approved ✓ · Settlement: 45 days</p>
          <p className="mt-1 font-semibold text-brass-deep">Seller match: 94%</p>
        </div>
      </div>
    );
  }
  return (
    <ol className="space-y-2.5 rounded-xl border border-line bg-white p-5 text-sm">
      <li className="flex gap-3">
        <span className="text-brass-deep">01</span>
        <span className="text-ink">Buyer submitted: Alex T. · Ready to make an offer</span>
      </li>
      <li className="flex gap-3">
        <span className="text-brass-deep">02</span>
        <span className="text-ink">
          CRM: contact created in Follow Up Boss <span className="text-green-700">✓</span>
        </span>
      </li>
      <li className="flex gap-3">
        <span className="text-brass-deep">03</span>
        <span className="text-ink">Dashboard updated: +1 offer · 94% seller match</span>
      </li>
    </ol>
  );
}

export function WorkflowTabs() {
  const [step, setStep] = useState(0);
  const tab = TABS[step];
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="How it works">
        {TABS.map((t, i) => (
          <button
            key={t.label}
            type="button"
            role="tab"
            aria-selected={i === step}
            onClick={() => setStep(i)}
            className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
              i === step ? "border-navy bg-navy text-paper" : "border-line bg-white text-ink hover:border-brass"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-10 grid items-center gap-10 md:grid-cols-2" role="tabpanel">
        <div>
          <h3 className="font-serif text-2xl text-ink sm:text-3xl">{tab.title}</h3>
          <p className="mt-3 leading-relaxed text-ink-soft">{tab.body}</p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {tab.points.map((p) => (
              <li key={p} className="rounded-full bg-brass/15 px-3 py-1 text-xs font-medium text-brass-deep">
                {p}
              </li>
            ))}
          </ul>
        </div>
        <Sample step={step} />
      </div>
    </div>
  );
}
