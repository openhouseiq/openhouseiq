"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/SubmitButton";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
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

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthLayout
      headline="Choose a new password"
      description="Enter a new password for your OpenHouseIQ account."
      footer="© 2026 OpenHouseIQ"
    >
      <h2 className="font-serif text-2xl font-medium text-ink">Set new password</h2>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <FormField
          label="New password"
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
        <FormField
          label="Confirm new password"
          id="confirm_password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <SubmitButton loading={loading}>Update password</SubmitButton>
      </form>
    </AuthLayout>
  );
}
