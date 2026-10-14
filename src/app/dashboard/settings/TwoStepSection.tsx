"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

type Enrolment = { id: string; qr: string; secret: string };

// Two-step login with an authenticator app (a time-based six-digit code).
export function TwoStepSection() {
  const [loading, setLoading] = useState(true);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    createClient()
      .auth.mfa.listFactors()
      .then(({ data }) => {
        if (cancelled) return;
        setFactorId(data?.totp?.[0]?.id ?? null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function startEnrolment() {
    setError(null);
    setMessage(null);
    setBusy(true);
    const supabase = createClient();

    // Clear any half-finished setup from an earlier attempt.
    const { data: existing } = await supabase.auth.mfa.listFactors();
    for (const factor of existing?.all ?? []) {
      if (factor.status === "unverified") {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }
    }

    const { data, error: enrolError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Authenticator ${new Date().toISOString().slice(0, 19)}`,
    });
    setBusy(false);

    if (enrolError || !data) {
      setError("Could not start setup. Please try again.");
      return;
    }
    setEnrolment({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    setCode("");
  }

  async function confirmEnrolment(e: React.FormEvent) {
    e.preventDefault();
    if (!enrolment) return;
    setError(null);
    setBusy(true);
    const { error: verifyError } = await createClient().auth.mfa.challengeAndVerify({
      factorId: enrolment.id,
      code: code.trim(),
    });
    setBusy(false);

    if (verifyError) {
      setError("That code didn't match. Check the app and try again.");
      return;
    }
    setFactorId(enrolment.id);
    setEnrolment(null);
    setCode("");
    setMessage("Two-step login is on. You'll be asked for a code each time you log in.");
  }

  async function turnOff(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setBusy(true);
    const supabase = createClient();

    // Turning protection off needs a fresh code, so a borrowed session can't do it.
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });
    if (verifyError) {
      setBusy(false);
      setError("That code didn't match. Check the app and try again.");
      return;
    }
    const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId });
    setBusy(false);

    if (removeError) {
      setError("Could not turn off two-step login. Please try again.");
      return;
    }
    setFactorId(null);
    setCode("");
    setMessage("Two-step login is off.");
  }

  const inputClasses =
    "w-full max-w-[10rem] rounded-md border border-line bg-white px-3 py-2 text-sm tracking-widest text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass";

  if (loading) {
    return <p className="text-sm text-ink-soft">Loading…</p>;
  }

  return (
    <div className="space-y-4" id="two-step">
      <p className="text-sm text-ink-soft">
        Adds a second check when you log in: a six-digit code from an authenticator app on your
        phone, such as Google Authenticator, 1Password or Authy.
      </p>

      {enrolment ? (
        <form onSubmit={confirmEnrolment} className="space-y-3">
          <p className="text-sm text-ink">1. Scan this code with your authenticator app.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enrolment.qr}
            alt="QR code for your authenticator app"
            className="h-40 w-40 bg-white p-2"
          />
          <p className="text-xs text-ink-soft">
            Can&apos;t scan it? Enter this key instead:{" "}
            <span className="select-all break-all font-mono text-ink">{enrolment.secret}</span>
          </p>
          <p className="text-sm text-ink">2. Enter the six-digit code the app shows.</p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="Six-digit code"
            className={inputClasses}
          />
          <div className="flex gap-3">
            <Button type="submit" variant="primary" disabled={busy}>
              {busy ? "Checking…" : "Turn on"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setEnrolment(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : factorId ? (
        <form onSubmit={turnOff} className="space-y-3">
          <p className="text-sm font-medium text-ink">Two-step login is on.</p>
          <p className="text-sm text-ink-soft">
            To turn it off, enter a current code from your app.
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            aria-label="Six-digit code"
            className={inputClasses}
          />
          <div>
            <Button type="submit" variant="secondary" disabled={busy}>
              {busy ? "Checking…" : "Turn off"}
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="primary" onClick={startEnrolment} disabled={busy}>
          {busy ? "Starting…" : "Set up two-step login"}
        </Button>
      )}

      {error ? <p className="text-sm text-error">{error}</p> : null}
      {message ? <p className="text-sm text-ink">{message}</p> : null}
    </div>
  );
}
