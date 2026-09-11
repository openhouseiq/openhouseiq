"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function StartTrialSection() {
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startTrial(plan: "monthly" | "yearly") {
    setError(null);
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const result = await res.json();
      if (!res.ok || !result.url) {
        setError(result.error ?? "Could not start your trial.");
        setLoading(null);
        return;
      }
      window.location.href = result.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          disabled={loading !== null}
          onClick={() => startTrial("monthly")}
        >
          {loading === "monthly" ? "Loading…" : "Start free trial — $29/month after"}
        </Button>
        <Button
          variant="secondary"
          disabled={loading !== null}
          onClick={() => startTrial("yearly")}
        >
          {loading === "yearly" ? "Loading…" : "Start free trial — $290/year after"}
        </Button>
      </div>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
