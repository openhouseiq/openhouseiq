"use client";

import { useState } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { AGENCY_DISCOUNT_TIERS } from "@/lib/types";

const BASE_PRICE = { monthly: 39, yearly: 390 };

function tierLabel(minSeats: number, maxSeats: number | null): string {
  return maxSeats === null ? `${minSeats}+ agents` : `${minSeats}-${maxSeats} agents`;
}

export function NewAgencyForm() {
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "").trim();

    try {
      const res = await fetch("/api/agency/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, plan }),
      });
      const result = await res.json();
      if (!res.ok || !result.url) {
        setError(result.error ?? "Could not start checkout.");
        setLoading(false);
        return;
      }
      window.location.href = result.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const base = BASE_PRICE[plan];

  return (
    <div className="mt-8 space-y-6">
      <div className="overflow-hidden rounded-md border border-line">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-paper-card text-left">
              <th className="px-4 py-2.5 font-medium text-ink">Agency size</th>
              <th className="px-4 py-2.5 font-medium text-ink">Discount</th>
              <th className="px-4 py-2.5 font-medium text-ink">
                Price per agent / {plan === "monthly" ? "month" : "year"}
              </th>
            </tr>
          </thead>
          <tbody>
            {AGENCY_DISCOUNT_TIERS.map((tier) => (
              <tr key={tier.minSeats} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 text-ink">
                  {tierLabel(tier.minSeats, tier.maxSeats)}
                </td>
                <td className="px-4 py-2.5 text-ink-soft">
                  {tier.discount > 0 ? `${Math.round(tier.discount * 100)}% off` : "—"}
                </td>
                <td className="px-4 py-2.5 font-medium text-ink">
                  ${(base * (1 - tier.discount)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field
          label="Agency name"
          id="name"
          type="text"
          placeholder="e.g. Harbourline Real Estate"
          required
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">Billing</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPlan("monthly")}
              className={`flex-1 rounded-md border px-4 py-2.5 text-sm font-medium ${
                plan === "monthly"
                  ? "border-brass bg-brass text-ink"
                  : "border-line bg-white text-ink-soft hover:border-brass hover:text-ink"
              }`}
            >
              Monthly — $39/agent
            </button>
            <button
              type="button"
              onClick={() => setPlan("yearly")}
              className={`flex-1 rounded-md border px-4 py-2.5 text-sm font-medium ${
                plan === "yearly"
                  ? "border-brass bg-brass text-ink"
                  : "border-line bg-white text-ink-soft hover:border-brass hover:text-ink"
              }`}
            >
              Yearly — $390/agent
            </button>
          </div>
        </div>

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <Button type="submit" variant="primary" disabled={loading} className="w-full">
          {loading ? "Starting checkout…" : "Start 14-day free trial"}
        </Button>
        <p className="text-center text-xs text-ink-soft">
          You start as the only seat. Invite agents from the agency dashboard
          once it&apos;s set up — the price per agent updates automatically
          as your team grows.
        </p>
      </form>
    </div>
  );
}
