"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function DeleteAccountSection() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "Could not delete account.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink">
        Permanently deletes your account, all your listings, photos, and any
        feedback or offers you&apos;ve received. This can&apos;t be undone.
      </p>
      <p className="text-sm text-ink-soft">
        Type <span className="font-medium text-ink">DELETE</span> to confirm.
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        className="w-full max-w-xs rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-error focus:outline-none focus:ring-1 focus:ring-error"
      />

      <p className="text-sm text-ink-soft">Then enter your password.</p>
      <input
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full max-w-xs rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-error focus:outline-none focus:ring-1 focus:ring-error"
      />

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <Button
        variant="danger"
        disabled={confirmText !== "DELETE" || !password || loading}
        onClick={handleDelete}
      >
        {loading ? "Deleting…" : "Delete my account"}
      </Button>
    </div>
  );
}
