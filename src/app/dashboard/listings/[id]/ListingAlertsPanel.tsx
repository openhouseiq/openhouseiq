"use client";

import { useState } from "react";

type Agent = { userId: string; name: string; on: boolean };

export function ListingAlertsPanel({
  listingId,
  currentUserId,
  creatorId,
  agents,
}: {
  listingId: string;
  currentUserId: string;
  creatorId: string;
  agents: Agent[];
}) {
  const [state, setState] = useState<Record<string, boolean>>(
    Object.fromEntries(agents.map((a) => [a.userId, a.on])),
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(agentId: string) {
    const next = !state[agentId];
    setSaving(agentId);
    setError(null);
    setState((s) => ({ ...s, [agentId]: next }));
    try {
      const res = await fetch("/api/listing-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, agentId, enabled: next }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Couldn't save. Please try again.");
      }
    } catch (e) {
      setState((s) => ({ ...s, [agentId]: !next }));
      setError(e instanceof Error ? e.message : "Couldn't save. Please try again.");
    } finally {
      setSaving(null);
    }
  }

  const ordered = [...agents].sort((a, b) =>
    a.userId === currentUserId ? -1 : b.userId === currentUserId ? 1 : 0,
  );
  const anyOn = Object.values(state).some(Boolean);

  return (
    <div className="mt-10 rounded-md border border-line bg-paper-card p-6">
      <h2 className="font-serif text-xl font-medium text-ink">
        Alerts for this listing
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        Everyone in your agency can see this listing. Tick the agents who
        should get an email and push alert for each new offer, feedback or
        application on this property.
      </p>

      <ul className="mt-4 divide-y divide-line">
        {ordered.map((a) => (
          <li key={a.userId} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">
                {a.name}
                {a.userId === currentUserId ? " (you)" : ""}
              </p>
              {a.userId === creatorId ? (
                <p className="text-xs text-ink-soft">Created this listing</p>
              ) : null}
            </div>
            <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                className="h-4 w-4 accent-navy"
                checked={state[a.userId] ?? false}
                disabled={saving === a.userId}
                onChange={() => toggle(a.userId)}
              />
              {state[a.userId] ? "Alerts on" : "Alerts off"}
            </label>
          </li>
        ))}
      </ul>

      {!anyOn ? (
        <p className="mt-3 text-sm text-ink-soft">
          With nobody ticked, the agency owner gets the alerts so nothing is
          missed.
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
