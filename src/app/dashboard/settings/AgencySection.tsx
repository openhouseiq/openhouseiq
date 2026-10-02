"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function AgencySection({
  membership,
  pendingInvite,
}: {
  membership: { agencyName: string; isOwner: boolean } | null;
  pendingInvite: { agencyId: string; agencyName: string } | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  async function handleAccept() {
    if (!pendingInvite) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agency/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId: pendingInvite.agencyId }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Could not accept invite.");
        setLoading(false);
        return;
      }
      setAccepted(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (accepted) {
    return (
      <p className="text-sm text-ink">
        You&apos;re in! Head to your{" "}
        <Link href="/dashboard/agency" className="text-brass underline">
          agency dashboard
        </Link>{" "}
        to see your team.
      </p>
    );
  }

  if (pendingInvite) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink">
          You&apos;ve been invited to join <strong>{pendingInvite.agencyName}</strong>
          &apos;s CueProperty agency plan.
        </p>
        <Button variant="primary" disabled={loading} onClick={handleAccept}>
          {loading ? "Joining…" : "Accept invite"}
        </Button>
        {error ? <p className="text-sm text-error">{error}</p> : null}
      </div>
    );
  }

  if (membership) {
    return (
      <p className="text-sm text-ink">
        {membership.isOwner ? "You manage" : "You're part of"}{" "}
        <strong>{membership.agencyName}</strong>&apos;s agency plan.{" "}
        <Link href="/dashboard/agency" className="text-brass underline">
          {membership.isOwner ? "Manage agency" : "View agency"}
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-ink-soft">
        Running a team? One subscription can cover your whole agency, with
        volume discounts as you add agents.
      </p>
      <Link href="/dashboard/agency/new" className="text-sm text-brass underline">
        Set up an agency plan
      </Link>
    </div>
  );
}
