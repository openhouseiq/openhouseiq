"use client";

import { useState } from "react";
import { Field, TextAreaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/ui/StarRating";
import { Turnstile } from "@/components/ui/Turnstile";
import type { InterestLevel, PurchaseTimeframe } from "@/lib/types";

const INTEREST_LEVELS: { value: InterestLevel; label: string }[] = [
  { value: "not_interested", label: "Not interested" },
  { value: "considering", label: "Considering" },
  { value: "very_interested", label: "Very interested" },
  { value: "ready_to_offer", label: "Ready to make an offer" },
];

const TIMEFRAMES: { value: PurchaseTimeframe; label: string }[] = [
  { value: "immediately", label: "Immediately" },
  { value: "one_to_three_months", label: "1–3 months" },
  { value: "three_to_six_months", label: "3–6 months" },
  { value: "six_plus_months", label: "6+ months" },
  { value: "just_browsing", label: "Just browsing" },
];

export function FeedbackForm({ listingId }: { listingId: string }) {
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
  const [timeframe, setTimeframe] = useState<PurchaseTimeframe | "">("");
  const [wantsFollowup, setWantsFollowup] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!interestLevel) {
      setError("Please let us know how interested you are.");
      return;
    }
    if (!ratingPrice || !ratingCondition || !ratingLocation || !ratingLayout) {
      setError("Please rate price, condition, location, and layout.");
      return;
    }
    if (!timeframe) {
      setError("Please select a purchase timeframe.");
      return;
    }

    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnstileToken: String(formData.get("cf-turnstile-response") ?? ""),
          listingId,
          isAnonymous: false,
          name: String(formData.get("name") ?? ""),
          email: String(formData.get("email") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          comments: String(formData.get("comments") ?? ""),
          interestLevel,
          ratingPrice,
          ratingCondition,
          ratingLocation,
          ratingLayout,
          preApproved,
          workingWithAgent,
          purchaseTimeframe: timeframe,
          wantsFollowup,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <p className="text-center text-sm text-ink">
        Thanks for your feedback!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          How interested are you in this property?
        </label>
        <div className="space-y-1.5">
          {INTEREST_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setInterestLevel(level.value)}
              className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                interestLevel === level.value
                  ? "border-pine bg-pine/5 text-ink"
                  : "border-line text-ink-soft"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-md border border-line p-4">
        <StarRating label="Price" value={ratingPrice} onChange={setRatingPrice} />
        <StarRating
          label="Condition"
          value={ratingCondition}
          onChange={setRatingCondition}
        />
        <StarRating
          label="Location"
          value={ratingLocation}
          onChange={setRatingLocation}
        />
        <StarRating label="Layout" value={ratingLayout} onChange={setRatingLayout} />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={preApproved}
            onChange={(e) => setPreApproved(e.target.checked)}
            className="h-4 w-4 rounded border-line text-pine focus:ring-pine"
          />
          I&apos;m pre-approved for finance
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={workingWithAgent}
            onChange={(e) => setWorkingWithAgent(e.target.checked)}
            className="h-4 w-4 rounded border-line text-pine focus:ring-pine"
          />
          I&apos;m already working with an agent
        </label>
        <div>
          <label
            htmlFor="timeframe"
            className="mb-1.5 block text-sm font-medium text-ink"
          >
            Purchase timeframe
          </label>
          <select
            id="timeframe"
            value={timeframe}
            required
            onChange={(e) => setTimeframe(e.target.value as PurchaseTimeframe)}
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine"
          >
            <option value="" disabled>
              Select one…
            </option>
            {TIMEFRAMES.map((tf) => (
              <option key={tf.value} value={tf.value}>
                {tf.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Field label="Name" id="name" type="text" required />
      <Field label="Email" id="email" type="email" required />
      <Field label="Phone" id="phone" type="tel" required />
      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={wantsFollowup}
          onChange={(e) => setWantsFollowup(e.target.checked)}
          className="h-4 w-4 rounded border-line text-pine focus:ring-pine"
        />
        I&apos;d like the agent to follow up with me
      </label>

      <TextAreaField label="Comments" id="comments" rows={4} required />

      <Turnstile />

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? "Sending…" : "Send feedback"}
      </Button>
    </form>
  );
}
