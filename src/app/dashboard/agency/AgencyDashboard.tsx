"use client";

import { useState } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { agencyDiscountForSeats, AGENCY_DISCOUNT_TIERS } from "@/lib/types";
import type { Agency, AgencyMember } from "@/lib/types";

function daysLeft(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

const STATUS_LABELS: Record<string, string> = {
  incomplete: "Setting up…",
  trialing: "Free trial",
  active: "Active",
  past_due: "Payment overdue",
  canceled: "Canceled",
  incomplete_expired: "Setup expired",
  unpaid: "Unpaid",
};

const BASE_PRICE = { monthly: 39, yearly: 390 };

function CreateAgencyForm() {
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = BASE_PRICE[plan];

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

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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

      <p className="text-xs text-ink-soft">
        {AGENCY_DISCOUNT_TIERS.filter((t) => t.discount > 0)
          .map(
            (t) =>
              `${t.minSeats}${t.maxSeats ? `-${t.maxSeats}` : "+"} agents: $${(base * (1 - t.discount)).toFixed(2)}/agent`,
          )
          .join(" · ")}
      </p>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? "Starting checkout…" : "Start 14-day free trial"}
      </Button>
      <p className="text-center text-xs text-ink-soft">
        You start as the only seat. Add agents from this page once it&apos;s
        set up — the price per agent drops automatically as your team grows.
      </p>
    </form>
  );
}

export function AgencyDashboard({
  agency,
  members,
  isOwner,
}: {
  agency: Agency | null;
  members: AgencyMember[];
  isOwner: boolean;
}) {
  const [memberList, setMemberList] = useState(members);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<{ email: string; tempPassword: string | null } | null>(
    null,
  );

  if (!agency) {
    return <CreateAgencyForm />;
  }

  const activeSeats = memberList.filter((m) => m.status === "active").length;
  const discount = agencyDiscountForSeats(activeSeats || 1);

  async function handleAddAgent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLastAdded(null);
    setAdding(true);
    try {
      const res = await fetch("/api/agency/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId: agency!.id, name, email }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Could not add agent.");
        return;
      }
      setMemberList((prev) => [
        ...prev,
        {
          id: result.memberId,
          agency_id: agency!.id,
          user_id: null,
          email: result.email,
          status: "active",
          invited_at: new Date().toISOString(),
          joined_at: new Date().toISOString(),
          removed_at: null,
        },
      ]);
      setLastAdded({ email: result.email, tempPassword: result.tempPassword ?? null });
      setName("");
      setEmail("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(memberId: string) {
    if (!window.confirm("Remove this agent from the agency?")) return;
    setRemovingId(memberId);
    setError(null);
    try {
      const res = await fetch("/api/agency/remove-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Could not remove member.");
        return;
      }
      setMemberList((prev) => prev.filter((m) => m.id !== memberId));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setRemovingId(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agency/portal", { method: "POST" });
      const result = await res.json();
      if (!res.ok || !result.url) {
        setError(result.error ?? "Could not open billing portal.");
        setPortalLoading(false);
        return;
      }
      window.location.href = result.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setPortalLoading(false);
    }
  }

  if (!isOwner) {
    return (
      <div className="mt-6 rounded-md border border-line bg-paper-card p-6">
        <p className="text-sm text-ink">
          You&apos;re covered under {agency.name}&apos;s CueProperty agency
          plan. Billing and the agent roster are managed by the agency owner.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-md border border-line bg-paper-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink">
              {STATUS_LABELS[agency.status] ?? agency.status}
              {agency.status === "trialing" && agency.trial_ends_at
                ? ` — ${daysLeft(agency.trial_ends_at)} day${daysLeft(agency.trial_ends_at) === 1 ? "" : "s"} left`
                : ""}
              {agency.status === "active" && agency.current_period_end
                ? ` — renews ${new Date(agency.current_period_end).toLocaleDateString()}`
                : ""}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {activeSeats} active {activeSeats === 1 ? "seat" : "seats"}
              {discount > 0 ? ` · ${Math.round(discount * 100)}% agency discount applied` : ""}
            </p>
          </div>
          {agency.stripe_customer_id ? (
            <Button variant="secondary" disabled={portalLoading} onClick={handlePortal}>
              {portalLoading ? "Loading…" : "Manage billing"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-md border border-line bg-paper-card p-6">
        <h2 className="mb-1 font-serif text-lg font-medium text-ink">Add an agent</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Enter their name and email — their account is created right away,
          no invite email to chase.
        </p>
        <form onSubmit={handleAddAgent} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field
              label="Name"
              id="agentName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <Field
              label="Email"
              id="agentEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="primary" disabled={adding}>
            {adding ? "Adding…" : "Add agent"}
          </Button>
        </form>

        {lastAdded ? (
          <div className="mt-4 rounded-md border border-brass bg-brass/5 p-4 text-sm">
            {lastAdded.tempPassword ? (
              <>
                <p className="font-medium text-ink">
                  Added. Share these login details with {lastAdded.email} —
                  shown only this once:
                </p>
                <p className="mt-2 font-mono text-ink">
                  Email: {lastAdded.email}
                  <br />
                  Temporary password: {lastAdded.tempPassword}
                </p>
                <p className="mt-2 text-xs text-ink-soft">
                  They can change this password anytime from Settings once
                  logged in.
                </p>
              </>
            ) : (
              <p className="text-ink">
                Added {lastAdded.email} — they already had an account, so
                they can keep using their existing login.
              </p>
            )}
          </div>
        ) : null}
        {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
      </div>

      <div className="rounded-md border border-line bg-paper-card p-6">
        <h2 className="mb-4 font-serif text-lg font-medium text-ink">Agents</h2>
        {memberList.length === 0 ? (
          <p className="text-sm text-ink-soft">No agents yet.</p>
        ) : (
          <ul className="space-y-2">
            {memberList.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between rounded-md border border-line px-4 py-2.5"
              >
                <div>
                  <p className="text-sm text-ink">{member.email}</p>
                  <p className="text-xs text-ink-soft">
                    {member.status === "active" ? "Active" : "Invited"}
                  </p>
                </div>
                {member.user_id !== agency.owner_user_id ? (
                  <button
                    type="button"
                    disabled={removingId === member.id}
                    onClick={() => handleRemove(member.id)}
                    className="text-sm text-error underline disabled:opacity-60"
                  >
                    {removingId === member.id ? "Removing…" : "Remove"}
                  </button>
                ) : (
                  <span className="text-xs text-ink-soft">Owner</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
