"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(false);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const newEmail = String(formData.get("email") ?? "");

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      email: newEmail,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPending(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Email" id="email" type="email" defaultValue={currentEmail} required />

      {error ? <p className="text-sm text-error">{error}</p> : null}
      {pending ? (
        <p className="text-sm text-pine">
          Check your inbox (old and new address) to confirm this change.
        </p>
      ) : null}

      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? "Saving…" : "Update email"}
      </Button>
    </form>
  );
}
