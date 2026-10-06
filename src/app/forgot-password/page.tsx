"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/auth/Turnstile";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError("Please complete the security check.");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
      captchaToken: captchaToken ?? undefined,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      setCaptchaToken(null);
      setCaptchaReset((n) => n + 1);
      return;
    }

    setSent(true);
  }

  return (
    <AuthLayout
      headline="Forgot your password?"
      description="Enter your email and we'll send you a link to reset it."
      footer="© 2026 CueProperty"
    >
      <h2 className="font-serif text-2xl font-medium text-ink">Reset password</h2>
      <p className="mt-1.5 text-sm text-[#3b4657]">
        <Link href="/login" className="text-brass underline">
          Back to login
        </Link>
      </p>

      {sent ? (
        <p className="mt-8 rounded-md border border-line bg-paper px-4 py-3 text-sm text-ink">
          Check your email for a link to reset your password.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <FormField label="Email" id="email" type="email" autoComplete="email" required />

          <Turnstile onToken={setCaptchaToken} resetKey={captchaReset} />

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <SubmitButton loading={loading}>Send reset link</SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
}
