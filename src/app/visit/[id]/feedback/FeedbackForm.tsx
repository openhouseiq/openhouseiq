"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field, TextAreaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function FeedbackForm({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [rating, setRating] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("feedback").insert({
      listing_id: listingId,
      is_anonymous: isAnonymous,
      name: isAnonymous ? null : String(formData.get("name") ?? ""),
      email: isAnonymous ? null : String(formData.get("email") ?? ""),
      phone: isAnonymous ? null : String(formData.get("phone") ?? "") || null,
      rating: rating || null,
      comments: String(formData.get("comments") ?? "") || null,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className="text-center text-sm text-ink">
        Thanks for your feedback!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              className={`text-2xl ${value <= rating ? "text-brass" : "text-line"}`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
          className="h-4 w-4 rounded border-line text-pine focus:ring-pine"
        />
        Submit anonymously
      </label>

      {!isAnonymous ? (
        <>
          <Field label="Name" id="name" type="text" required={!isAnonymous} />
          <Field label="Email" id="email" type="email" required={!isAnonymous} />
          <Field label="Phone (optional)" id="phone" type="tel" />
        </>
      ) : null}

      <TextAreaField label="Comments" id="comments" rows={4} />

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? "Sending…" : "Send feedback"}
      </Button>
    </form>
  );
}
