"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { readUtmCookie } from "@/lib/utm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Turnstile, TURNSTILE_SITE_KEY } from "@/components/auth/Turnstile";
import { MIN_PASSWORD_LENGTH, PASSWORD_HINT } from "@/lib/passwordPolicy";

const fileInputClasses =
  "w-full text-sm text-[#3b4657] file:mr-3 file:rounded-md file:border-0 file:bg-brass file:px-3 file:py-2 file:text-sm file:font-medium file:text-ink";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [accountType, setAccountType] = useState<"solo" | "agency">(
    searchParams.get("type") === "agency" ? "agency" : "solo",
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError("Please complete the security check.");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("accountType", accountType);
    const fullName = String(formData.get("fullName") ?? "");
    const agencyName = accountType === "agency" ? String(formData.get("agencyName") ?? "").trim() : "";
    const phone = String(formData.get("phone") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const utm = readUtmCookie();

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken: captchaToken ?? undefined,
        data: {
          full_name: fullName,
          phone,
          ...utm,
          ...(agencyName ? { account_type: "agency", agency_name: agencyName } : {}),
        },
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      setCaptchaToken(null);
      setCaptchaReset((n) => n + 1);
      return;
    }

    // The profile details were sent with the signup itself. A headshot can
    // only be uploaded once there's a signed-in session, which exists right
    // away only when email confirmation is off; otherwise it can be added in
    // Settings after confirming.
    const photo = formData.get("photo");
    if (data.session && data.user && photo instanceof File && photo.size > 0) {
      await uploadSignupHeadshot(supabase, data.user.id, photo).catch(() => {});
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
      description="Open Home Hero helps real estate agents run open homes and follow up with leads in one place."
      footer="© 2026 Open Home Hero"
    >
      <h2 className="font-serif text-2xl font-medium text-ink">
        Create your account
      </h2>
      <p className="mt-1.5 text-sm text-[#3b4657]">
        Already have an account?{" "}
        <Link href="/login" className="text-brass underline">
          Log in
        </Link>
      </p>

      {checkEmail ? (
        <p className="mt-8 rounded-md border border-line bg-paper px-4 py-3 text-sm text-ink">
          Check your email to confirm your account before logging in.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">I&apos;m signing up as</p>
            <div className="flex gap-2">
              {(
                [
                  ["solo", "An individual agent"],
                  ["agency", "An agency"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAccountType(value)}
                  className={`flex-1 rounded-md border px-3 py-2.5 text-sm font-medium ${
                    accountType === value
                      ? "border-brass bg-brass text-ink"
                      : "border-line bg-white text-[#3b4657] hover:border-brass hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {accountType === "agency" ? (
              <p className="mt-1.5 text-xs text-[#3b4657]">
                You&apos;ll manage the agency and add your agents after
                signing up. Volume discounts apply from 3 agents.
              </p>
            ) : null}
          </div>
          {accountType === "agency" ? (
            <FormField
              label="Agency name"
              id="agencyName"
              type="text"
              autoComplete="organization"
              required
            />
          ) : null}
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
            minLength={MIN_PASSWORD_LENGTH}
            required
          />
          <p className="mt-1.5 text-xs text-[#3b4657]">{PASSWORD_HINT}</p>

          <div className="border-t border-line pt-4">
            <label htmlFor="photo" className="mb-1.5 block text-sm font-medium text-ink">
              Headshot
            </label>
            <p className="mb-1.5 text-xs text-[#3b4657]">
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

          <Turnstile onToken={setCaptchaToken} resetKey={captchaReset} />

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <SubmitButton loading={loading}>Sign up</SubmitButton>

          <p className="text-center text-xs text-[#3b4657]">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-brass underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-brass underline">
              Privacy Policy
            </Link>
            .
          </p>
        </form>
      )}
    </AuthLayout>
  );
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

async function uploadSignupHeadshot(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  file: File,
) {
  if (!file.type.startsWith("image/") || file.size > MAX_PHOTO_BYTES) return;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const path = `${userId}/photo-${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from("agent-assets").upload(path, file);
  if (error) return;
  const { publicUrl } = supabase.storage.from("agent-assets").getPublicUrl(path).data;
  await supabase.auth.updateUser({ data: { photo_url: publicUrl } });
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
