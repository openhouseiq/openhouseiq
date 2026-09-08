"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Subscription } from "@/lib/types";

function daysLeft(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function BillingSection({ subscription }: { subscription: Subscription | null }) {
  const [loading, setLoading] = useState<"monthly" | "yearly" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isTrialing = subscription?.status === "trialing";
  const isActive = subscription?.status === "active";
  const hasAccess =
    isActive || (isTrialing && subscription?.trial_ends_at && daysLeft(subscription.trial_ends_at) > 0);

  async function goToCheckout(plan: "monthly" | "yearly") {
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
        setError(result.error ?? "Could not start checkout.");
        setLoading(null);
        return;
      }
      window.location.href = result.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  async function goToPortal() {
    setError(null);
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const result = await res.json();
      if (!res.ok || !result.url) {
        setError(result.error ?? "Could not open billing portal.");
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
      {isActive ? (
        <p className="text-sm text-ink">
          You&apos;re on the OpenHouseIQ Pro plan.
          {subscription?.current_period_end
            ? ` Renews ${new Date(subscription.current_period_end).toLocaleDateString()}.`
            : ""}
        </p>
      ) : isTrialing && subscription?.trial_ends_at ? (
        hasAccess ? (
          <p className="text-sm text-ink">
            Free trial —{" "}
            <span className="font-medium">
              {daysLeft(subscription.trial_ends_at)} day
              {daysLeft(subscription.trial_ends_at) === 1 ? "" : "s"} left
            </span>
            . Subscribe any time to keep creating listings after it ends.
          </p>
        ) : (
          <p className="text-sm text-error">
            Your free trial has ended. You can still view existing listings and
            feedback, but subscribe to create new listings again.
          </p>
        )
      ) : (
        <p className="text-sm text-error">
          Your subscription is inactive. You can still view existing listings
          and feedback, but subscribe to create new listings again.
        </p>
      )}

      {!isActive ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            disabled={loading !== null}
            onClick={() => goToCheckout("monthly")}
          >
            {loading === "monthly" ? "Loading…" : "Subscribe — $29/month"}
          </Button>
          <Button
            variant="secondary"
            disabled={loading !== null}
            onClick={() => goToCheckout("yearly")}
          >
            {loading === "yearly" ? "Loading…" : "Subscribe — $290/year"}
          </Button>
          {subscription?.stripe_customer_id ? (
            <button
              type="button"
              disabled={loading !== null}
              onClick={goToPortal}
              className="text-sm text-pine underline disabled:opacity-60"
            >
              {loading === "portal" ? "Loading…" : "Manage billing"}
            </button>
          ) : null}
        </div>
      ) : (
        <Button variant="secondary" disabled={loading !== null} onClick={goToPortal}>
          {loading === "portal" ? "Loading…" : "Manage billing"}
        </Button>
      )}

      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
