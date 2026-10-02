"use client";

import { useState } from "react";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { agencyDiscountForSeats } from "@/lib/types";
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

export function AgencyDashboard({
  agency,
  members,
  isOwner,
}: {
  agency: Agency;
  members: AgencyMember[];
  isOwner: boolean;
}) {
  const [memberList, setMemberList] = useState(members);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const activeSeats = memberList.filter((m) => m.status === "active").length;
  const discount = agencyDiscountForSeats(activeSeats || 1);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setInviting(true);
    try {
      const res = await fetch("/api/agency/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId: agency.id, email: inviteEmail }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Could not send invite.");
        return;
      }
      setMemberList((prev) => [
        ...prev,
        {
          id: result.memberId ?? `pending-${inviteEmail}`,
          agency_id: agency.id,
          user_id: null,
          email: inviteEmail.trim().toLowerCase(),
          status: "invited",
          invited_at: new Date().toISOString(),
          joined_at: null,
          removed_at: null,
        },
      ]);
      setInviteEmail("");
      setNotice("Invite sent.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setInviting(false);
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
          plan. Billing is managed by the agency owner.
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
        <h2 className="mb-4 font-serif text-lg font-medium text-ink">Invite an agent</h2>
        <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field
              label="Email"
              id="inviteEmail"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="primary" disabled={inviting}>
            {inviting ? "Sending…" : "Send invite"}
          </Button>
        </form>
        {notice ? <p className="mt-2 text-sm text-ink-soft">{notice}</p> : null}
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
