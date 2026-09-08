"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/SubmitButton";

const fileInputClasses =
  "w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-pine file:px-3 file:py-2 file:text-sm file:font-medium file:text-paper";

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
    const phone = String(formData.get("phone") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    if (data.user) {
      formData.set("userId", data.user.id);
      await fetch("/api/signup-profile", { method: "POST", body: formData }).catch(
        () => {},
      );
    }

    setLoading(false);

    if (data.session) {
      router.push("/dashboard/welcome");
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
            label="Phone number"
            id="phone"
            type="tel"
            autoComplete="tel"
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

          <div className="border-t border-line pt-4">
            <label htmlFor="photo" className="mb-1.5 block text-sm font-medium text-ink">
              Headshot
            </label>
            <p className="mb-1.5 text-xs text-ink-soft">
              Optional — shown on your exported reports. You can add this
              later from Settings.
            </p>
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              className={fileInputClasses}
            />
          </div>

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <SubmitButton loading={loading}>Sign up</SubmitButton>

          <p className="text-center text-xs text-ink-soft">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-pine underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-pine underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
