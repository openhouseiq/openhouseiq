"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { RENTAL_FORMS } from "@/lib/rentalForms";
import type { RentalState } from "@/lib/rentalForms/types";
import {
  RentalFormSections,
  type AnswerMap,
  type AnswerValue,
} from "@/components/rentalForms/RentalFormView";

const inputClasses =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass";

function initialValues(config: Record<string, unknown>): AnswerMap {
  const out: AnswerMap = {};
  for (const [k, v] of Object.entries(config)) {
    if (k === "ranking") continue;
    if (typeof v === "boolean" || typeof v === "string") out[k] = v;
    else if (typeof v === "number") out[k] = String(v);
  }
  return out;
}

export function RentalSettingsForm({
  listingId,
  state,
  config,
  leasedOn,
}: {
  listingId: string;
  state: RentalState;
  config: Record<string, unknown>;
  leasedOn: string | null;
}) {
  const router = useRouter();
  const form = RENTAL_FORMS[state];
  const ranking = (config.ranking ?? {}) as { maxRentShare?: number | null; preferredMoveIn?: string | null };
  const [values, setValues] = useState<AnswerMap>(initialValues(config));
  const [share, setShare] = useState(
    ranking.maxRentShare ? String(Math.round(ranking.maxRentShare * 100)) : "30",
  );
  const [moveIn, setMoveIn] = useState(ranking.preferredMoveIn ?? "");
  const [leased, setLeased] = useState(leasedOn ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function onChange(id: string, value: AnswerValue) {
    setSaved(false);
    setValues((v) => ({ ...v, [id]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    const cfg: Record<string, string | boolean> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v !== undefined && v !== "") cfg[k] = v;
    }
    try {
      const res = await fetch("/api/rental-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          state,
          config: cfg,
          ranking: {
            maxRentShare: share ? Number(share) / 100 : null,
            preferredMoveIn: moveIn || null,
          },
          leasedOn: leased || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        const label = result.field
          ? form.agentSections.flatMap((s) => s.fields).find((f) => f.id === result.field)?.label
          : null;
        setError(label ? `${result.error} Check: ${label}` : (result.error ?? "Could not save."));
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={save} className="mt-8 space-y-6">
      <div className="rounded-md border border-line bg-paper-card p-4 text-sm text-ink-soft">
        <strong className="text-ink">{form.formName}</strong> ({form.version}). These are the
        items the official {form.stateName} form says the agent completes. Applicants see them on
        the form, and applications open once every required item is saved.
      </div>

      <RentalFormSections sections={form.agentSections} values={values} onChange={onChange} />

      <section className="rounded-md border border-line bg-paper-card p-5">
        <h3 className="font-serif text-lg font-medium text-ink">Landlord settings for ranking</h3>
        <p className="mt-1 text-sm text-ink-soft">
          Used only to rank applicants, from information on the official form. Pets and minimum
          lease term are set under Edit listing.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="share" className="mb-1.5 block text-sm font-medium text-ink">
              Rent should be no more than this share of weekly income (%)
            </label>
            <input
              id="share"
              type="number"
              min={10}
              max={60}
              value={share}
              onChange={(e) => setShare(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor="movein" className="mb-1.5 block text-sm font-medium text-ink">
              Move-in date the landlord wants
            </label>
            <input
              id="movein"
              type="date"
              value={moveIn}
              onChange={(e) => setMoveIn(e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>
      </section>

      <section className="rounded-md border border-line bg-paper-card p-5">
        <h3 className="font-serif text-lg font-medium text-ink">When the property is leased</h3>
        <p className="mt-1 text-sm text-ink-soft">
          Unsuccessful applications are deleted automatically after the period the state sets
          (30 days in Victoria and South Australia; 90 days in Queensland). Without a date they
          are deleted 6 months after they arrive. Successful applications stay until you delete
          them.
        </p>
        <div className="mt-4 max-w-xs">
          <label htmlFor="leased" className="mb-1.5 block text-sm font-medium text-ink">
            Date leased
          </label>
          <input
            id="leased"
            type="date"
            value={leased}
            onChange={(e) => setLeased(e.target.value)}
            className={inputClasses}
          />
        </div>
      </section>

      {error ? <p className="text-sm text-error">{error}</p> : null}
      {saved ? <p className="text-sm text-ink">Saved.</p> : null}

      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? "Saving…" : "Save rental settings"}
      </Button>
    </form>
  );
}
