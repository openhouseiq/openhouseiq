"use client";

import { useState } from "react";
import { Field, TextAreaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Turnstile } from "@/components/ui/Turnstile";
import {
  APPLICANT_LEASE_TERM_OPTIONS,
  INCOME_RANGE_OPTIONS,
} from "@/components/listings/landlordPreferences";

const selectClasses =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine";

export function ApplicationForm({ listingId }: { listingId: string }) {
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
      const res = await fetch("/api/applicants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnstileToken: String(formData.get("cf-turnstile-response") ?? ""),
          listingId,
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          phone: String(formData.get("phone") ?? "") || null,
          employer: String(formData.get("employer") ?? "") || null,
          occupation: String(formData.get("occupation") ?? "") || null,
          incomeRange: String(formData.get("income_range") ?? "") || null,
          canProvideProofOfIncome: formData.get("can_provide_proof_of_income") === "on",
          desiredMoveInDate: String(formData.get("desired_move_in_date") ?? "") || null,
          desiredLeaseTerm: String(formData.get("desired_lease_term") ?? "") || null,
          hasPets: formData.get("has_pets") === "on",
          petDetails: String(formData.get("pet_details") ?? "") || null,
          numberOfOccupants: formData.get("number_of_occupants")
            ? Number(formData.get("number_of_occupants"))
            : null,
          isSmoker: formData.get("is_smoker") === "on",
          referenceName: String(formData.get("reference_name") ?? "") || null,
          referencePhone: String(formData.get("reference_phone") ?? "") || null,
          referenceRelationship:
            String(formData.get("reference_relationship") ?? "") || null,
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
        Thanks — your application has been submitted. The agent will be in
        touch if you&apos;re shortlisted.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Name" id="name" type="text" required />
      <Field label="Email" id="email" type="email" required />
      <Field label="Phone" id="phone" type="tel" />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Employer" id="employer" type="text" />
        <Field label="Occupation" id="occupation" type="text" />
      </div>

      <div>
        <label htmlFor="income_range" className="mb-1.5 block text-sm font-medium text-ink">
          Household income
        </label>
        <select id="income_range" name="income_range" className={selectClasses}>
          <option value="" disabled selected>
            Select one…
          </option>
          {INCOME_RANGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="can_provide_proof_of_income"
          className="h-4 w-4 rounded border-line text-pine focus:ring-pine"
        />
        Can provide proof of income / employment if asked
      </label>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Desired move-in date" id="desired_move_in_date" type="date" />
        <div>
          <label
            htmlFor="desired_lease_term"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Desired lease term
          </label>
          <select
            id="desired_lease_term"
            name="desired_lease_term"
            className={selectClasses}
          >
            <option value="" disabled selected>
              Select one…
            </option>
            {APPLICANT_LEASE_TERM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Field
        label="Number of occupants"
        id="number_of_occupants"
        type="number"
        min={1}
        step="1"
      />

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="has_pets"
          className="h-4 w-4 rounded border-line text-pine focus:ring-pine"
        />
        I have pets
      </label>
      <Field label="Pet details (optional)" id="pet_details" type="text" />

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          name="is_smoker"
          className="h-4 w-4 rounded border-line text-pine focus:ring-pine"
        />
        I smoke
      </label>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Reference name" id="reference_name" type="text" />
        <Field label="Reference phone" id="reference_phone" type="tel" />
      </div>
      <Field
        label="Relationship (e.g. previous landlord)"
        id="reference_relationship"
        type="text"
      />

      <TextAreaField label="Notes (optional)" id="notes" rows={3} />

      <Turnstile />

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? "Submitting…" : "Submit application"}
      </Button>
    </form>
  );
}
