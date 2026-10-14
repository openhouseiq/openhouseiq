"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { MIN_PASSWORD_LENGTH, PASSWORD_HINT } from "@/lib/passwordPolicy";

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
      description="Enter a new password for your Open Home Hero account."
      footer="© 2026 Open Home Hero"
    >
      <h2 className="font-serif text-2xl font-medium text-ink">Set new password</h2>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <FormField
          label="New password"
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
      <p className="mt-1.5 text-xs text-[#3b4657]">{PASSWORD_HINT}</p>
        <FormField
          label="Confirm new password"
          id="confirm_password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          required
        />

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <SubmitButton loading={loading}>Update password</SubmitButton>
      </form>
    </AuthLayout>
  );
}
