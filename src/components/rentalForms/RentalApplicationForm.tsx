"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Turnstile } from "@/components/ui/Turnstile";
import { RENTAL_FORMS } from "@/lib/rentalForms";
import { describeAgentItems } from "@/lib/rentalForms/describe";
import type { RentalState } from "@/lib/rentalForms/types";
import { RentalFormSections, type AnswerMap, type AnswerValue } from "./RentalFormView";

export function RentalApplicationForm({
  listingId,
  state,
  config,
}: {
  listingId: string;
  state: RentalState;
  config: Record<string, unknown>;
}) {
  const form = RENTAL_FORMS[state];
  const [values, setValues] = useState<AnswerMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const agentItems = describeAgentItems(form, config);

  function onChange(id: string, value: AnswerValue) {
    setValues((v) => ({ ...v, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const answers: Record<string, string | boolean> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v !== undefined && v !== "") answers[k] = v;
    }
    try {
      const res = await fetch("/api/rental-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnstileToken: String(formData.get("cf-turnstile-response") ?? ""),
          listingId,
          answers,
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
        Thanks — your application has been submitted. The agent will be in touch if you&apos;re
        shortlisted.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-md border border-line bg-paper-card p-4">
        <p className="text-xs uppercase tracking-wide text-ink-soft">{form.authority}</p>
        <h3 className="mt-1 font-serif text-xl font-medium text-ink">{form.formName}</h3>
        <p className="mt-1 text-xs text-ink-soft">{form.version}</p>
      </div>

      <div className="rounded-md border border-line bg-paper-card p-4">
        <h4 className="font-serif text-base font-medium text-ink">Before you apply</h4>
        <ul className="mt-2 space-y-2 text-sm text-ink-soft">
          {form.notices.map((n) => (
            <li key={n.title}>
              <strong className="text-ink">{n.title}.</strong> {n.body}
            </li>
          ))}
        </ul>
      </div>

      {agentItems.map((s) => (
        <section key={s.title} className="rounded-md border border-line bg-white p-4">
          <h4 className="font-serif text-base font-medium text-ink">{s.title}</h4>
          <dl className="mt-2 space-y-1 text-sm">
            {s.rows.map((r) => (
              <div key={r.label} className="flex flex-col sm:flex-row sm:gap-2">
                <dt className="text-ink-soft sm:w-1/2">{r.label}</dt>
                <dd className="text-ink">{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <RentalFormSections sections={form.applicantSections} values={values} onChange={onChange} />

      <p className="rounded-md border border-line bg-paper-card p-4 text-sm text-ink-soft">
        {form.consent}
      </p>

      <Turnstile />

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? "Submitting…" : "Submit application"}
      </Button>
    </form>
  );
}
