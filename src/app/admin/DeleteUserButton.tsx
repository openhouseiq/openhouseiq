"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteUserButton({
  userId,
  email,
  status,
  listingsCount,
}: {
  userId: string;
  email: string;
  status: string;
  listingsCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Never rendered as clickable for a protected account — belt and
  // braces alongside the server-side check in the API route.
  if (status === "active" || status === "trialing") {
    return null;
  }

  async function deleteUser() {
    const listingsWarning =
      listingsCount > 0
        ? ` This will also delete their ${listingsCount} listing${listingsCount === 1 ? "" : "s"} and all associated feedback/offers.`
        : "";
    if (
      !window.confirm(
        `Permanently delete ${email}?${listingsWarning} This can't be undone.`,
      )
    ) {
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "Could not delete user.");
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
        onClick={deleteUser}
        className="text-xs text-error underline disabled:opacity-60"
      >
        {loading ? "Deleting…" : "Delete"}
      </button>
      {error ? <p className="mt-1 text-xs text-error">{error}</p> : null}
    </div>
  );
}
