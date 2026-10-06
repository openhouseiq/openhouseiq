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

    router.push(isFirstLogin ? "/dashboard/welcome" : "/dashboard");
    router.refresh();
  }

  return (
    <AuthLayout
      headline="Welcome back."
      description="Log in to manage your open houses and follow up with your leads."
      footer="© 2026 CueProperty"
    >
      <h2 className="font-serif text-2xl font-medium text-ink">Log in</h2>
      <p className="mt-1.5 text-sm text-[#3b4657]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-brass underline">
          Sign up
        </Link>
      </p>

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
    </AuthLayout>
  );
}
