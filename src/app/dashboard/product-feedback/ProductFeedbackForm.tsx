"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StarRating } from "@/components/ui/StarRating";
import { TextAreaField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function ProductFeedbackForm() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!rating) {
      setError("Please give an overall rating.");
      return;
    }

    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("product_feedback").insert({
      user_id: user.id,
      overall_rating: rating,
      liked_most: String(formData.get("liked_most") ?? "") || null,
      biggest_frustration: String(formData.get("biggest_frustration") ?? "") || null,
      would_recommend: wouldRecommend,
      additional_comments: String(formData.get("additional_comments") ?? "") || null,
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <StarRating label="Overall, how has it been?" value={rating} onChange={setRating} />

      <TextAreaField
        label="What's been most useful?"
        id="liked_most"
        rows={3}
      />

      <TextAreaField
        label="What's been frustrating or missing?"
        id="biggest_frustration"
        rows={3}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          Would you recommend OpenHouseIQ to another agent?
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setWouldRecommend(true)}
            className={`rounded-md border px-4 py-2 text-sm ${
              wouldRecommend === true
                ? "border-pine bg-pine/5 text-ink"
                : "border-line text-ink-soft"
            }`}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setWouldRecommend(false)}
            className={`rounded-md border px-4 py-2 text-sm ${
              wouldRecommend === false
                ? "border-pine bg-pine/5 text-ink"
                : "border-line text-ink-soft"
            }`}
          >
            Not yet
          </button>
        </div>
      </div>

      <TextAreaField
        label="Anything else you'd like us to know?"
        id="additional_comments"
        rows={3}
      />

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? "Submitting…" : "Submit feedback"}
      </Button>
    </form>
  );
}
