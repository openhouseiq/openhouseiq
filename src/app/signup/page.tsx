"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/SubmitButton";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullName = String(formData.get("fullName") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setCheckEmail(true);
    }
  }

  return (
    <AuthLayout
      headline="List more homes, faster."
      description="OpenHouseIQ helps real estate agents run open houses and follow up with leads in one place."
      footer="© 2026 OpenHouseIQ"
    >
      <h2 className="font-serif text-2xl font-medium text-ink">
        Create your account
      </h2>
      <p className="mt-1.5 text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="text-pine underline">
          Log in
        </Link>
      </p>

      {checkEmail ? (
        <p className="mt-8 rounded-md border border-line bg-paper px-4 py-3 text-sm text-ink">
          Check your email to confirm your account before logging in.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <FormField
            label="Full name"
            id="fullName"
            type="text"
            autoComplete="name"
            required
          />
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
            autoComplete="new-password"
            minLength={6}
            required
          />

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <SubmitButton loading={loading}>Sign up</SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
}
