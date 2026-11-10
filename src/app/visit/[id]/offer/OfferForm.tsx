"use client";

import { useRef, useState } from "react";
import { Field, TextAreaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Turnstile } from "@/components/ui/Turnstile";
import { ChoiceChips } from "@/components/visit/ChoiceChips";
import { VisitorDetailsFields } from "@/components/visit/VisitorDetailsFields";
import { saveVisitorDetails, useVisitorDetails } from "@/lib/visitorDetails";
import { resetTurnstile, waitForTurnstileToken } from "@/lib/turnstileClient";
import { SETTLEMENT_OPTIONS } from "@/components/listings/sellerPreferences";
import { parseOfferAmount } from "@/lib/offerAmount";
import { terms } from "@/lib/country";

// Quick on a phone: details pre-filled for returning visitors, the amount
// accepts "750,000" or "$750k"-style typing and shows what it read, and
// finance and settlement are one tap each instead of dropdowns.

type Financing = "cash" | "pre_approved" | "financing";

const FINANCE_OPTIONS: { value: Financing; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "pre_approved", label: "Pre-approved" },
  { value: "financing", label: "Arranging finance" },
];

export function OfferForm({ listingId, country }: { listingId: string; country?: string | null }) {
  const t = terms(country);
  const visitor = useVisitorDetails();
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [amountText, setAmountText] = useState("");
  const [financing, setFinancing] = useState<Financing | null>(null);
  const [settlement, setSettlement] = useState<string | null>(null);

  const amount = parseOfferAmount(amountText);

  function showError(message: string) {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!amount) return showError("Please enter your offer amount, for example 750,000.");
    if (!financing) return showError("Please tap how you'll pay: cash, pre-approved or arranging finance.");
    if (!settlement) return showError(`Please tap your preferred ${t.settlement}.`);

    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const { name, email, phone } = visitor.details;

    try {
      const turnstileToken = await waitForTurnstileToken(form);
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnstileToken,
          listingId,
          name,
          email,
          phone: phone || null,
          offerAmount: amount,
          financingType: financing,
          settlementTerm: settlement,
          waiveInspection: formData.get("waive_inspection") === "on",
          notes: String(formData.get("notes") ?? "") || null,
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        resetTurnstile();
        showError(
          res.status === 400 && String(result.error ?? "").includes("CAPTCHA")
            ? "We couldn't confirm you're not a robot. Please tap the button again."
            : result.error ?? "Something went wrong. Please tap the button again.",
        );
        return;
      }

      saveVisitorDetails({ name, email, phone });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      resetTurnstile();
      showError("No connection. Check your signal and tap the button again. Nothing you've typed is lost.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-2 text-center">
        <p className="font-serif text-2xl text-ink">Your offer has been sent.</p>
        <p className="text-sm text-ink-soft">The agent will be in touch about next steps.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <VisitorDetailsFields visitor={visitor} phoneRequired={false} />

      <div className="space-y-6 border-t border-line pt-6">
        <div>
          <Field
            label="Your offer"
            id="offer_amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="e.g. 750,000"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            required
          />
          {amountText ? (
            <p className={`mt-1 text-sm ${amount ? "text-ink" : "text-error"}`}>
              {amount
                ? `$${amount.toLocaleString("en-AU")}`
                : "Type the amount in numbers, for example 750,000"}
            </p>
          ) : null}
        </div>

        <ChoiceChips label="How will you pay?" options={FINANCE_OPTIONS} value={financing} onChange={setFinancing} />

        <ChoiceChips
          label={`Preferred ${t.settlement}`}
          options={SETTLEMENT_OPTIONS.map((o) => (o.value === "flexible" ? { ...o, label: "Flexible" } : o))}
          value={settlement}
          onChange={setSettlement}
        />

        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
          <input
            type="checkbox"
            name="waive_inspection"
            className="h-5 w-5 rounded border-line text-brass focus:ring-brass"
          />
          {t.waiveInspection}
        </label>

        <TextAreaField label="Conditions or notes (optional)" id="notes" rows={3} />
      </div>

      <div className="space-y-4">
        <Turnstile />

        {error ? (
          <p ref={errorRef} role="alert" className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </p>
        ) : null}

        <Button type="submit" variant="primary" disabled={loading} className="w-full py-3 text-base">
          {loading ? "Sending your offer…" : "Send offer"}
        </Button>
      </div>
    </form>
  );
}
