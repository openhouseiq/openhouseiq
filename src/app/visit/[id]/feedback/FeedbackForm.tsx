"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { TextAreaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { Turnstile } from "@/components/ui/Turnstile";
import { ChoiceChips } from "@/components/visit/ChoiceChips";
import { VisitorDetailsFields } from "@/components/visit/VisitorDetailsFields";
import { saveVisitorDetails, useVisitorDetails } from "@/lib/visitorDetails";
import { resetTurnstile, waitForTurnstileToken } from "@/lib/turnstileClient";
import type { InterestLevel, PurchaseTimeframe } from "@/lib/types";
import { CUSTOM_ANSWER_MAX } from "@/lib/customQuestions";

// The open home sign-in form. Built to be quick on a phone: only name, email
// and mobile are required, everything else is one tap and can be skipped,
// returning visitors are pre-filled, and nothing typed is lost on an error.

function interestLevels(isRental: boolean): { value: InterestLevel; label: string }[] {
  return [
    { value: "not_interested", label: "Not for me" },
    { value: "considering", label: "Considering" },
    { value: "very_interested", label: "Very interested" },
    { value: "ready_to_offer", label: isRental ? "Ready to apply" : "Ready to offer" },
  ];
}

const TIMEFRAMES: { value: PurchaseTimeframe; label: string }[] = [
  { value: "immediately", label: "Now" },
  { value: "one_to_three_months", label: "1–3 months" },
  { value: "three_to_six_months", label: "3–6 months" },
  { value: "six_plus_months", label: "6+ months" },
  { value: "just_browsing", label: "Just looking" },
];

export function FeedbackForm({
  listingId,
  isRental = false,
  customQuestions = [],
  offerHref,
}: {
  listingId: string;
  isRental?: boolean;
  customQuestions?: string[];
  /** Where "Make an offer" goes after signing in (sale listings only). */
  offerHref?: string;
}) {
  const visitor = useVisitorDetails();
  const errorRef = useRef<HTMLParagraphElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [interestLevel, setInterestLevel] = useState<InterestLevel | null>(null);
  const [ratingPrice, setRatingPrice] = useState(0);
  const [ratingCondition, setRatingCondition] = useState(0);
  const [ratingLocation, setRatingLocation] = useState(0);
  const [ratingLayout, setRatingLayout] = useState(0);
  const [preApproved, setPreApproved] = useState(false);
  const [workingWithAgent, setWorkingWithAgent] = useState(false);
  const [timeframe, setTimeframe] = useState<PurchaseTimeframe | null>(null);
  const [wantsFollowup, setWantsFollowup] = useState(false);

  function showError(message: string) {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const { name, email, phone } = visitor.details;

    try {
      const turnstileToken = await waitForTurnstileToken(form);
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnstileToken,
          listingId,
          isAnonymous: false,
          name,
          email,
          phone,
          comments: String(formData.get("comments") ?? ""),
          interestLevel,
          ratingPrice: ratingPrice || null,
          ratingCondition: ratingCondition || null,
          ratingLocation: ratingLocation || null,
          ratingLayout: ratingLayout || null,
          preApproved,
          workingWithAgent,
          purchaseTimeframe: timeframe,
          wantsFollowup,
          customAnswers: customQuestions.map((_, i) => String(formData.get(`customAnswer${i}`) ?? "")),
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        resetTurnstile();
        showError(
          res.status === 400 && String(result.error ?? "").includes("CAPTCHA")
            ? "We couldn't confirm you're not a robot. Please tap the button again."
            : result.error ?? "Something went wrong. Please tap the button again.",
        );
        return;
      }

      saveVisitorDetails({ name, email, phone });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      resetTurnstile();
      showError("No connection. Check your signal and tap the button again. Nothing you've typed is lost.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4 text-center">
        <p className="font-serif text-2xl text-ink">You&apos;re signed in. Thank you!</p>
        <p className="text-sm text-ink-soft">
          {wantsFollowup
            ? "The agent has your callback request and will be in touch."
            : "The agent has your details and feedback."}
        </p>
        {offerHref ? (
          <Link href={offerHref} className="block pt-2">
            <Button variant="secondary" className="w-full">
              Ready to make an offer?
            </Button>
          </Link>
        ) : null}
      </div>
    );
  }

  const sectionTitle = "font-serif text-lg font-medium text-ink";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className={sectionTitle}>Sign in</h3>
          <p className="mt-1 text-xs text-ink-soft">
            Your details go only to the agent hosting this {isRental ? "inspection" : "open home"}.
          </p>
        </div>
        <VisitorDetailsFields visitor={visitor} />
        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-brass/60 bg-brass/5 p-3 text-sm text-ink">
          <input
            type="checkbox"
            checked={wantsFollowup}
            onChange={(e) => setWantsFollowup(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-line text-brass focus:ring-brass"
          />
          <span>
            <span className="font-medium">Please call me back</span>
            <span className="block text-xs text-ink-soft">Tick this and the agent will give you a call.</span>
          </span>
        </label>
      </section>

      <section className="space-y-6 border-t border-line pt-6">
        <div>
          <h3 className={sectionTitle}>Quick feedback</h3>
          <p className="mt-1 text-xs text-ink-soft">All optional. Tap what applies, skip what doesn&apos;t.</p>
        </div>

        <ChoiceChips
          label="How interested are you?"
          options={interestLevels(isRental)}
          value={interestLevel}
          onChange={setInterestLevel}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">Your rating</p>
          <div className="divide-y divide-line rounded-md border border-line px-3">
            {(
              [
                ["Price", ratingPrice, setRatingPrice],
                ["Condition", ratingCondition, setRatingCondition],
                ["Location", ratingLocation, setRatingLocation],
                ["Layout", ratingLayout, setRatingLayout],
              ] as const
            ).map(([label, value, set]) => (
              <div key={label} className="py-1.5">
                <StarRating label={label} value={value} onChange={set} allowClear inline />
              </div>
            ))}
          </div>
        </div>

        {isRental ? null : (
          <ChoiceChips
            label="When are you looking to buy?"
            options={TIMEFRAMES}
            value={timeframe}
            onChange={setTimeframe}
          />
        )}

        <div className="space-y-1">
          {isRental ? null : (
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
              <input
                type="checkbox"
                checked={preApproved}
                onChange={(e) => setPreApproved(e.target.checked)}
                className="h-5 w-5 rounded border-line text-brass focus:ring-brass"
              />
              I&apos;m pre-approved for finance
            </label>
          )}
          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={workingWithAgent}
              onChange={(e) => setWorkingWithAgent(e.target.checked)}
              className="h-5 w-5 rounded border-line text-brass focus:ring-brass"
            />
            I&apos;m already working with an agent
          </label>
        </div>

        {customQuestions.map((question, i) => (
          <TextAreaField
            key={i}
            label={question}
            id={`customAnswer${i}`}
            rows={2}
            maxLength={CUSTOM_ANSWER_MAX}
          />
        ))}

        <TextAreaField label="Anything else? (optional)" id="comments" rows={3} />
      </section>

      <div className="space-y-4">
        <Turnstile />

        {error ? (
          <p ref={errorRef} role="alert" className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">
            {error}
          </p>
        ) : null}

        <Button type="submit" variant="primary" disabled={loading} className="w-full py-3 text-base">
          {loading ? "Signing you in…" : "Sign in"}
        </Button>
      </div>
    </form>
  );
}
