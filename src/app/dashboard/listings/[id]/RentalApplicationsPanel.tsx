"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RENTAL_FORMS } from "@/lib/rentalForms";
import { describeAnswers } from "@/lib/rentalForms/describe";
import type { RentalState } from "@/lib/rentalForms/types";
import type { RentalApplicationStatus } from "@/lib/types";
import type { RankedItem } from "@/lib/rentalForms/rankListing";

const STATUS_LABELS: Record<RentalApplicationStatus, string> = {
  new: "New",
  shortlisted: "Shortlisted",
  successful: "Successful",
  unsuccessful: "Unsuccessful",
};

export function RentalApplicationsPanel({
  state,
  items,
  notRanked,
}: {
  state: RentalState;
  items: RankedItem[];
  /** Factors this state's form does not collect, so the ranking does not use them. */
  notRanked: string[];
}) {
  const router = useRouter();
  const form = RENTAL_FORMS[state];
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(id: string, status: RentalApplicationStatus) {
    setBusy(id);
    setError(null);
    const { error: e } = await createClient().from("rental_applications").update({ status }).eq("id", id);
    setBusy(null);
    if (e) setError("Could not update. Please try again.");
    else router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this application permanently? This cannot be undone.")) return;
    setBusy(id);
    setError(null);
    const { error: e } = await createClient().from("rental_applications").delete().eq("id", id);
    setBusy(null);
    if (e) setError("Could not delete. Please try again.");
    else router.refresh();
  }

  return (
    <section className="mt-10">
      <h2 className="font-serif text-xl font-medium text-ink">
        Applications ({items.length}), ranked
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        {form.stateName}: {form.formName}. Ranked as a guide for the landlord. You decide.
        {notRanked.length > 0
          ? ` This state's form does not ask about ${notRanked.join(", ")}, so those are not used.`
          : ""}
      </p>
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">No applications yet.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {items.map((a, i) => {
            const details = open === a.id ? describeAnswers(form, a.answers) : [];
            return (
              <li key={a.id} className="rounded-md border border-line bg-paper-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-serif text-lg text-ink">
                      {i + 1}. {a.name}
                      {a.isNew ? (
                        <span className="ml-2 rounded-full bg-brass px-2 py-0.5 text-xs font-medium text-ink">
                          New
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {[a.email, a.phone].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <span className="rounded-full bg-brass px-3 py-1 text-sm font-semibold text-ink">
                    {a.score}% match
                  </span>
                </div>
                <div className="mt-2 h-2 rounded bg-line">
                  <div className="h-2 rounded bg-brass" style={{ width: `${a.score}%` }} />
                </div>
                {a.unmet.map((u) => (
                  <p key={u} className="mt-2 rounded bg-error/10 px-2 py-1 text-xs text-error">
                    Landlord condition not met: {u}
                  </p>
                ))}
                <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                  <div>
                    <p className="font-medium text-ink">Why they rank well</p>
                    <ul className="mt-1 list-disc pl-4 text-ink-soft">
                      {a.positives.length ? a.positives.map((p) => <li key={p}>{p}</li>) : <li>None yet</li>}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-ink">Things to check</p>
                    <ul className="mt-1 list-disc pl-4 text-ink-soft">
                      {a.concerns.length ? a.concerns.map((c) => <li key={c}>{c}</li>) : <li>Nothing flagged</li>}
                    </ul>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <label className="flex items-center gap-2 text-ink">
                    Status
                    <select
                      value={a.status}
                      disabled={busy === a.id}
                      onChange={(e) => setStatus(a.id, e.target.value as RentalApplicationStatus)}
                      className="rounded-md border border-line bg-white px-2 py-1 text-sm"
                    >
                      {(Object.keys(STATUS_LABELS) as RentalApplicationStatus[]).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => setOpen(open === a.id ? null : a.id)}
                    className="text-brass underline"
                  >
                    {open === a.id ? "Hide application" : "View application"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    disabled={busy === a.id}
                    className="text-ink-soft underline"
                  >
                    Delete
                  </button>
                </div>
                {details.length > 0 ? (
                  <div className="mt-4 space-y-4 border-t border-line pt-4 text-sm">
                    {details.map((s) => (
                      <div key={s.title}>
                        <p className="font-medium text-ink">{s.title}</p>
                        <dl className="mt-1 space-y-0.5">
                          {s.rows.map((r) => (
                            <div key={r.label} className="flex flex-col sm:flex-row sm:gap-2">
                              <dt className="text-ink-soft sm:w-1/2">{r.label}</dt>
                              <dd className="text-ink">{r.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
