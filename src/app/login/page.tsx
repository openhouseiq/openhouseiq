"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/SubmitButton";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthLayout
      headline="Welcome back."
      description="Log in to manage your open houses and follow up with your leads."
      footer="© 2026 OpenHouseIQ"
    >
      <h2 className="font-serif text-2xl font-medium text-ink">Log in</h2>
      <p className="mt-1.5 text-sm text-ink-soft">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-pine underline">
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
          <Link href="/forgot-password" className="text-pine underline">
            Forgot password?
          </Link>
        </p>

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <SubmitButton loading={loading}>Log in</SubmitButton>
      </form>
    </AuthLayout>
  );
}
