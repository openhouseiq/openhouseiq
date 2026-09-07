"use client";

import { useState } from "react";
import { Field, TextAreaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { HoneypotField, HONEYPOT_FIELD_NAME } from "@/components/ui/HoneypotField";
import { Turnstile } from "@/components/ui/Turnstile";

export function OfferForm({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          website: String(formData.get(HONEYPOT_FIELD_NAME) ?? ""),
          turnstileToken: String(formData.get("cf-turnstile-response") ?? ""),
          listingId,
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          phone: String(formData.get("phone") ?? "") || null,
          offerAmount: Number(formData.get("offer_amount")),
          financingType: String(formData.get("financing_type") ?? "") || null,
          settlementTerm: String(formData.get("settlement_term") ?? "") || null,
          waiveInspection: formData.get("waive_inspection") === "on",
          notes: String(formData.get("notes") ?? "") || null,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <p className="text-center text-sm text-ink">
        Thanks — your offer has been submitted.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <HoneypotField />
      <Field label="Name" id="name" type="text" required />
      <Field label="Email" id="email" type="email" required />
      <Field label="Phone" id="phone" type="tel" />
      <Field label="Offer amount" id="offer_amount" type="number" min={0} step="1" required />

      <div>
        <label htmlFor="financing_type" className="mb-1.5 block text-sm font-medium text-ink">
          Financing
        </label>
        <select
          id="financing_type"
          name="financing_type"
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine"
        >
          <option value="cash">Cash buyer</option>
          <option value="pre_approved">Pre-approved financing</option>
          <option value="financing">Financing (not yet approved)</option>
        </select>
      </div>

      <Field
        label="Preferred settlement term"
        id="settlement_term"
        type="text"
        placeholder="e.g. 30 days"
      />

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="waive_inspection"
          className="h-4 w-4 rounded border-line text-pine focus:ring-pine"
        />
        Willing to waive building & pest inspection
      </label>

      <TextAreaField label="Notes (optional)" id="notes" rows={3} />

      <Turnstile />

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? "Submitting…" : "Submit offer"}
      </Button>
    </form>
  );
}
