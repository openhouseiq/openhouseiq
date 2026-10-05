"use client";

import { useState } from "react";

type Result = {
  userId: string;
  owedCents: number;
  status: string;
  error?: string;
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Paid",
  would_pay: "Ready to pay",
  below_minimum: "Below $50 minimum",
  no_payout_account: "No payout account yet",
  account_not_ready: "Payout setup unfinished",
  failed: "Failed",
};

export function PayoutRunner({ emails }: { emails: Record<string, string> }) {
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState<"preview" | "pay" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(dryRun: boolean) {
    if (!dryRun && !window.confirm("Send real cash payouts to everyone marked ready?")) return;
    setError(null);
    setLoading(dryRun ? "preview" : "pay");
    try {
      const res = await fetch("/api/admin/referral-payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Could not run payouts.");
        return;
      }
      setResults(result.results);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => run(true)}
          className="rounded-md border border-line bg-white px-4 py-2 text-sm text-ink disabled:opacity-60"
        >
          {loading === "preview" ? "Checking…" : "Preview payouts"}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => run(false)}
          className="rounded-md bg-brass px-4 py-2 text-sm font-medium text-ink disabled:opacity-60"
        >
          {loading === "pay" ? "Paying…" : "Run payouts now"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-error">{error}</p> : null}
      {results ? (
        results.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">Nobody is owed any cash right now.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {results.map((r) => (
              <li
                key={r.userId}
                className="flex items-center justify-between rounded-md border border-line px-4 py-2.5 text-sm"
              >
                <span className="text-ink">{emails[r.userId] ?? r.userId}</span>
                <span className="text-ink-soft">
                  ${(r.owedCents / 100).toFixed(2)} · {STATUS_LABELS[r.status] ?? r.status}
                  {r.error ? ` (${r.error})` : ""}
                </span>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
