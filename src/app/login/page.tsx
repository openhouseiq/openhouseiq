"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/auth/Turnstile";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  // Set when the account has two-step login switched on and still needs its code.
  const [mfa, setMfa] = useState<{ factorId: string; destination: string } | null>(null);

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
    const password = String(formData.get("password") ?? "");

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken: captchaToken ?? undefined },
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      setCaptchaToken(null);
      setCaptchaReset((n) => n + 1);
      return;
    }

    const createdAt = data.user ? new Date(data.user.created_at).getTime() : 0;
    const lastSignInAt = data.user?.last_sign_in_at
      ? new Date(data.user.last_sign_in_at).getTime()
      : 0;
    const isFirstLogin = lastSignInAt - createdAt < 30 * 60 * 1000;

    const destination = isFirstLogin ? "/dashboard/welcome" : "/dashboard";

    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance && assurance.nextLevel === "aal2" && assurance.currentLevel !== "aal2") {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp?.[0];
      if (factor) {
        setMfa({ factorId: factor.id, destination });
        return;
      }
    }

    router.push(destination);
    router.refresh();
  }

  async function handleMfaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mfa) return;
    setError(null);
    setLoading(true);

    const code = String(new FormData(e.currentTarget).get("code") ?? "").trim();
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: mfa.factorId,
      code,
    });

    setLoading(false);

    if (verifyError) {
      setError("That code didn't work. Check your authenticator app and try again.");
      return;
    }

    router.push(mfa.destination);
    router.refresh();
  }

  async function handleCancelMfa() {
    await createClient().auth.signOut();
    setMfa(null);
    setError(null);
    setCaptchaToken(null);
    setCaptchaReset((n) => n + 1);
  }

  return (
    <AuthLayout
      headline="Welcome back."
      description="Log in to manage your open homes and follow up with your leads."
      footer="© 2026 Open Home Hero"
    >
      <h2 className="font-serif text-2xl font-medium text-ink">Log in</h2>
      <p className="mt-1.5 text-sm text-[#3b4657]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-brass underline">
          Sign up
        </Link>
      </p>

      {mfa ? (
        <form onSubmit={handleMfaSubmit} className="mt-8 space-y-4">
          <p className="text-sm text-[#3b4657]">
            Enter the 6-digit code from your authenticator app to finish logging in.
          </p>
          <FormField
            label="Code"
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
          />
          {error ? <p className="text-sm text-error">{error}</p> : null}
          <SubmitButton loading={loading}>Verify</SubmitButton>
          <button type="button" onClick={handleCancelMfa} className="text-sm text-brass underline">
            Use a different account
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <FormField
            label="Email"
            id="email"
            type="email"
            autoComplete="email"
            required
          />
          <FormField
            label="Password"
            id="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <p className="text-right text-sm">
            <Link href="/forgot-password" className="text-brass underline">
              Forgot password?
            </Link>
          </p>

          <Turnstile onToken={setCaptchaToken} resetKey={captchaReset} />

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <SubmitButton loading={loading}>Log in</SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
}
