"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ExtendTrialButton({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function extend(days: number) {
    if (!window.confirm(`Grant ${email} a ${days}-day pilot trial?`)) {
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/extend-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, days }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Could not extend trial.");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={() => extend(90)}
        className="text-xs text-pine underline disabled:opacity-60"
      >
        {loading ? "Updating…" : "Set 90-day pilot"}
      </button>
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
    </div>
  );
}
