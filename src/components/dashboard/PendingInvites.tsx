"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Invite = { id: string; agencyName: string };

/**
 * Shown to someone an agency owner has invited. Joining is the invited
 * person's own choice: nothing about their account changes until they
 * press Accept here.
 */
export function PendingInvites({ invites }: { invites: Invite[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (invites.length === 0) return null;

  async function answer(memberId: string, accept: boolean) {
    setError(null);
    setBusyId(memberId);
    try {
      const res = await fetch("/api/agency/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, accept }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Could not answer the invitation.");
        return;
      }
      router.push(accept ? "/dashboard" : "/dashboard/welcome");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-6 space-y-3">
      {invites.map((invite) => (
        <div key={invite.id} className="rounded-md border border-brass bg-brass/10 px-6 py-4">
          <p className="text-sm font-medium text-ink">
            {invite.agencyName} has invited you to join their agency plan.
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            If you accept, the agency pays for your licence. Any personal subscription you have
            now is cancelled, and you&apos;ll share new listings with the agency.
          </p>
          <div className="mt-3 flex gap-3">
            <Button variant="primary" disabled={busyId === invite.id} onClick={() => answer(invite.id, true)}>
              {busyId === invite.id ? "Please wait…" : "Accept invitation"}
            </Button>
            <Button variant="secondary" disabled={busyId === invite.id} onClick={() => answer(invite.id, false)}>
              Decline
            </Button>
          </div>
        </div>
      ))}
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
