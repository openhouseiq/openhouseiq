"use client";

import { useState } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import {
  AGENCY_BASE_PRICE,
  AGENCY_DISCOUNT_TIERS,
  AGENCY_MAX_SELF_SERVE_SEATS,
  agencyDiscountForSeats,
  agencyPricePerAgent,
  agencyTotalPrice,
} from "@/lib/types";
import type { Agency, AgencyMember } from "@/lib/types";

const CONTACT_HREF =
  "mailto:contact@cueproperty.com.au?subject=" +
  encodeURIComponent("Agency pricing for more than 20 agents");

function daysLeft(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function money(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

const seatOptions = Array.from({ length: AGENCY_MAX_SELF_SERVE_SEATS }, (_, i) => i + 1);

function PriceTable({ interval }: { interval: "month" | "year" }) {
  const base = AGENCY_BASE_PRICE[interval];
  return (
    <div className="rounded-md border border-line bg-white text-sm">
      {AGENCY_DISCOUNT_TIERS.map((t, i) => (
        <div
          key={t.minSeats}
          className={`flex justify-between px-4 py-2 ${i > 0 ? "border-t border-line" : ""}`}
        >
          <span className="text-ink">
            {t.minSeats === t.maxSeats ? `${t.minSeats}` : `${t.minSeats}–${t.maxSeats}`} agents
          </span>
          <span className="text-ink-soft">
            {money(base * (1 - t.discount))} each
            {t.discount > 0 ? ` · ${Math.round(t.discount * 100)}% off` : ""}
          </span>
        </div>
      ))}
      <div className="flex justify-between border-t border-line px-4 py-2">
        <span className="text-ink">More than {AGENCY_MAX_SELF_SERVE_SEATS} agents</span>
        <a href={CONTACT_HREF} className="text-brass underline">
          Contact us
        </a>
      </div>
    </div>
  );
}

export function CreateAgencyForm({ initialName }: { initialName?: string }) {
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const perAgent = agencyPricePerAgent(seats, interval);
  const total = agencyTotalPrice(seats, interval);
  const per = interval === "year" ? "year" : "month";

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
        body: JSON.stringify({ name, plan: interval === "year" ? "yearly" : "monthly", seats }),
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
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <Field
        label="Agency name"
        id="name"
        type="text"
        placeholder="e.g. Harbourline Real Estate"
        defaultValue={initialName}
        required
      />

      <div>
        <label htmlFor="seats" className="mb-1.5 block text-sm font-medium text-ink">
          How many agents? (including you)
        </label>
        <select
          id="seats"
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
        >
          {seatOptions.map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "agent" : "agents"}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-ink-soft">
          Need more than {AGENCY_MAX_SELF_SERVE_SEATS}?{" "}
          <a href={CONTACT_HREF} className="text-brass underline">
            Contact us for pricing
          </a>
          . You can add or remove licences any time.
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">Billing</label>
        <div className="flex gap-2">
          {(
            [
              ["month", "Monthly"],
              ["year", "Yearly"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setInterval(value)}
              className={`flex-1 rounded-md border px-4 py-2.5 text-sm font-medium ${
                interval === value
                  ? "border-brass bg-brass text-ink"
                  : "border-line bg-white text-ink-soft hover:border-brass hover:text-ink"
              }`}
            >
              {label}
              {value === "year" ? " — 2 months free" : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-brass bg-brass/5 px-4 py-3">
        <p className="text-sm text-ink">
          {seats} {seats === 1 ? "agent" : "agents"} × {money(perAgent)} ={" "}
          <strong className="font-medium">
            {money(total)} per {per}
          </strong>
        </p>
        {agencyDiscountForSeats(seats) > 0 ? (
          <p className="mt-0.5 text-xs text-ink-soft">
            Includes {Math.round(agencyDiscountForSeats(seats) * 100)}% off per agent for a team of{" "}
            {seats}.
          </p>
        ) : null}
      </div>

      <PriceTable interval={interval} />

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? "Starting checkout…" : "Start 14-day free trial"}
      </Button>
      <p className="text-center text-xs text-ink-soft">
        You won&apos;t be charged until your trial ends. You&apos;ll invite your agents by
        email from the Manage page once it&apos;s set up.
      </p>
    </form>
  );
}

export function AgencyDashboard({
  agency,
  members,
  isOwner,
  justPaid,
}: {
  agency: Agency | null;
  members: AgencyMember[];
  isOwner: boolean;
  justPaid: boolean;
}) {
  const [memberList, setMemberList] = useState(members);
  const [now] = useState(() => Date.now());
  const [seats, setSeats] = useState(agency?.seats ?? 1);
  const [pendingSeats, setPendingSeats] = useState<number | null>(agency?.pending_seats ?? null);
  const [targetSeats, setTargetSeats] = useState(agency?.pending_seats ?? agency?.seats ?? 1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [savingSeats, setSavingSeats] = useState(false);
  const [seatsMessage, setSeatsMessage] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<{
    email: string;
    isNewAccount: boolean;
    emailSent: boolean;
    setupLink: string | null;
  } | null>(null);

  if (!agency) {
    return <CreateAgencyForm />;
  }

  // Checkout was started but never completed — let the owner pick it back up.
  if (agency.status === "incomplete" && !agency.stripe_subscription_id) {
    if (justPaid) {
      return (
        <div className="mt-6 rounded-md border border-brass bg-brass/5 p-6">
          <p className="text-sm text-ink">
            Thanks — your payment details are in and we&apos;re finishing the
            setup. Refresh this page in a few seconds.
          </p>
        </div>
      );
    }
    return (
      <>
        <p className="mt-2 text-sm text-ink-soft">
          Your agency isn&apos;t active yet — checkout wasn&apos;t finished.
          Continue below to start your free trial.
        </p>
        <CreateAgencyForm initialName={agency.name} />
      </>
    );
  }

  const activeSeats = memberList.filter((m) => m.status === "active").length;
  const freeSeats = Math.max(0, seats - activeSeats);
  const interval = agency.billing_interval ?? "month";
  const per = interval === "year" ? "year" : "month";
  const trialing = agency.status === "trialing";
  const nextSeats = pendingSeats ?? seats;
  const periodEnd = agency.current_period_end ? new Date(agency.current_period_end) : null;

  // Estimate what an increase would cost today, pro rata for what's left of
  // the current billing period.
  let proratedCharge: number | null = null;
  if (periodEnd && !trialing && targetSeats > seats) {
    const periodStart = new Date(periodEnd);
    if (interval === "year") periodStart.setFullYear(periodStart.getFullYear() - 1);
    else periodStart.setMonth(periodStart.getMonth() - 1);
    const total = periodEnd.getTime() - periodStart.getTime();
    const remaining = Math.min(Math.max(periodEnd.getTime() - now, 0), total);
    const diff = agencyTotalPrice(targetSeats, interval) - agencyTotalPrice(seats, interval);
    proratedCharge = Math.round(diff * (remaining / total) * 100) / 100;
  }

  async function handleSaveSeats() {
    setError(null);
    setSeatsMessage(null);
    setSavingSeats(true);
    try {
      const res = await fetch("/api/agency/seats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId: agency!.id, seats: targetSeats }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Could not update your licences.");
        return;
      }
      setSeats(result.seats);
      setPendingSeats(result.pendingSeats);
      setTargetSeats(result.pendingSeats ?? result.seats);
      setSeatsMessage(
        result.pendingSeats !== null
          ? `Done. You'll move to ${result.pendingSeats} licences${periodEnd ? ` on ${formatDate(periodEnd.toISOString())}` : " at your next billing date"}.`
          : "Done. Your licences are updated.",
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSavingSeats(false);
    }
  }

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
      setLastAdded({
        email: result.email,
        isNewAccount: Boolean(result.isNewAccount),
        emailSent: Boolean(result.emailSent),
        setupLink: result.setupLink ?? null,
      });
      setName("");
      setEmail("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(memberId: string) {
    if (!window.confirm("Remove this agent? Their licence becomes free to give to someone else.")) {
      return;
    }
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

  const seatsChanged = targetSeats !== (pendingSeats ?? seats);

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-md border border-line bg-paper-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink">
              {STATUS_LABELS[agency.status] ?? agency.status}
              {trialing && agency.trial_ends_at
                ? ` — ${daysLeft(agency.trial_ends_at)} day${daysLeft(agency.trial_ends_at) === 1 ? "" : "s"} left`
                : ""}
              {agency.status === "active" && periodEnd ? ` — renews ${formatDate(periodEnd.toISOString())}` : ""}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {seats} {seats === 1 ? "licence" : "licences"} · {activeSeats} in use · {freeSeats} free
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {trialing ? "First bill" : "Next bill"}:{" "}
              {money(agencyTotalPrice(nextSeats, interval))} per {per} ({nextSeats} ×{" "}
              {money(agencyPricePerAgent(nextSeats, interval))})
              {periodEnd ? ` on ${formatDate(periodEnd.toISOString())}` : ""}
            </p>
            {pendingSeats !== null ? (
              <p className="mt-1 text-sm text-ink-soft">
                Reducing to {pendingSeats} {pendingSeats === 1 ? "licence" : "licences"} from your
                next billing date.
              </p>
            ) : null}
          </div>
          {agency.stripe_customer_id ? (
            <Button variant="secondary" disabled={portalLoading} onClick={handlePortal}>
              {portalLoading ? "Loading…" : "Manage billing"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-md border border-line bg-paper-card p-6">
        <h2 className="mb-1 font-serif text-lg font-medium text-ink">Licences</h2>
        <p className="mb-4 text-sm text-ink-soft">
          One licence per agent. Adding licences takes effect straight away and
          is charged for the rest of the current {per}. Removing licences takes
          effect from your next billing date.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-48">
            <label htmlFor="targetSeats" className="mb-1.5 block text-sm font-medium text-ink">
              Total licences
            </label>
            <select
              id="targetSeats"
              value={targetSeats}
              onChange={(e) => {
                setTargetSeats(Number(e.target.value));
                setSeatsMessage(null);
              }}
              className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass"
            >
              {seatOptions.map((n) => (
                <option key={n} value={n} disabled={n < activeSeats}>
                  {n} {n === 1 ? "licence" : "licences"}
                  {n < activeSeats ? " (in use)" : ""}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="primary"
            disabled={savingSeats || !seatsChanged}
            onClick={handleSaveSeats}
          >
            {savingSeats ? "Saving…" : "Update licences"}
          </Button>
        </div>

        {seatsChanged ? (
          <p className="mt-3 text-sm text-ink-soft">
            {targetSeats > seats
              ? trialing
                ? `New total: ${money(agencyTotalPrice(targetSeats, interval))} per ${per}. Nothing is charged until your trial ends.`
                : `New total: ${money(agencyTotalPrice(targetSeats, interval))} per ${per}. Charged today, pro rata for the rest of this ${per}: about ${money(proratedCharge ?? 0)}.`
              : trialing
                ? `New total: ${money(agencyTotalPrice(targetSeats, interval))} per ${per}, from your first bill.`
                : `New total: ${money(agencyTotalPrice(targetSeats, interval))} per ${per}, from ${periodEnd ? formatDate(periodEnd.toISOString()) : "your next billing date"}. Nothing is refunded for this ${per}.`}
          </p>
        ) : null}
        {seatsMessage ? <p className="mt-3 text-sm text-ink">{seatsMessage}</p> : null}
        <p className="mt-3 text-xs text-ink-soft">
          More than {AGENCY_MAX_SELF_SERVE_SEATS} agents?{" "}
          <a href={CONTACT_HREF} className="text-brass underline">
            Contact us for pricing
          </a>
          .
        </p>
      </div>

      <div className="rounded-md border border-line bg-paper-card p-6">
        <h2 className="mb-1 font-serif text-lg font-medium text-ink">Add an agent</h2>
        <p className="mb-4 text-sm text-ink-soft">
          {freeSeats > 0
            ? `You have ${freeSeats} free ${freeSeats === 1 ? "licence" : "licences"}. Enter their name and email — we'll email them a link to set their password and log in.`
            : "All your licences are in use. Add a licence above, then add the agent."}
        </p>
        <form onSubmit={handleAddAgent} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field
              label="Name"
              id="agentName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={freeSeats === 0}
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
              disabled={freeSeats === 0}
              required
            />
          </div>
          <Button type="submit" variant="primary" disabled={adding || freeSeats === 0}>
            {adding ? "Adding…" : "Add agent"}
          </Button>
        </form>

        {lastAdded ? (
          <div className="mt-4 rounded-md border border-brass bg-brass/5 p-4 text-sm text-ink">
            {lastAdded.emailSent ? (
              <p>
                Added {lastAdded.email}.{" "}
                {lastAdded.isNewAccount
                  ? "We've emailed them a link to set their password and log in."
                  : "They already had an account, so we've emailed them to say they can keep using their existing login."}
              </p>
            ) : lastAdded.setupLink ? (
              <>
                <p className="font-medium">
                  Added {lastAdded.email}, but we couldn&apos;t send the email. Send them this link
                  to set their password:
                </p>
                <p className="mt-2 break-all font-mono text-xs">{lastAdded.setupLink}</p>
              </>
            ) : (
              <p>
                Added {lastAdded.email}. We couldn&apos;t send the email, so let them know they can
                log in with their existing login.
              </p>
            )}
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

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
                  <p className="text-xs text-ink-soft">Active</p>
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
