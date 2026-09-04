"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function PasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    form.reset();
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        label="New password"
        id="password"
        type="password"
        autoComplete="new-password"
        minLength={6}
        required
      />
      <Field
        label="Confirm new password"
        id="confirm_password"
        type="password"
        autoComplete="new-password"
        minLength={6}
        required
      />

      {error ? <p className="text-sm text-error">{error}</p> : null}
      {saved ? <p className="text-sm text-pine">Password updated.</p> : null}

      <Button type="submit" variant="primary" disabled={loading}>
        {loading ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
