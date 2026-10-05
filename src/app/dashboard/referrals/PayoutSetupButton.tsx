"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function PayoutSetupButton({ label }: { label: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/referrals/connect", { method: "POST" });
      const result = await res.json();
      if (!res.ok || !result.url) {
        setError(result.error ?? "Could not start payout setup.");
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
    <div>
      <Button variant="secondary" disabled={loading} onClick={start}>
        {loading ? "Opening Stripe…" : label}
      </Button>
      {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
    </div>
  );
}
