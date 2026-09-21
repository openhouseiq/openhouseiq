"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { scoreApplicant, type ApplicantScore } from "@/lib/rentalScoring";
import { toCsv, downloadCsv } from "@/lib/csv";
import {
  LEASE_TERM_LABELS,
  INCOME_RANGE_LABELS,
} from "@/components/listings/landlordPreferences";
import type { Feedback, Applicant, Listing } from "@/lib/types";

type ScoringListing = Pick<
  Listing,
  | "landlord_pref_pets"
  | "landlord_pref_min_lease_term"
  | "landlord_pref_smoking"
  | "landlord_pref_employment_verification"
>;

const INTEREST_LEVEL_LABELS: Record<string, string> = {
  not_interested: "Not interested",
  considering: "Considering",
  very_interested: "Very interested",
  ready_to_offer: "Ready to apply",
};

const INTEREST_LEVEL_STYLES: Record<string, string> = {
  not_interested: "bg-line text-ink-soft",
  considering: "bg-line text-ink-soft",
  very_interested: "bg-brass text-paper",
  ready_to_offer: "bg-pine text-paper",
};

function CategoryStars({ label, value }: { label: string; value: number | null }) {
  if (!value) return null;
  return (
    <p className="text-xs text-ink-soft">
      {label}: <span className="text-brass">{"★".repeat(value)}{"☆".repeat(5 - value)}</span>
    </p>
  );
}

function MatchBadge({ score }: { score: ApplicantScore }) {
  if (score.unmetRequired.length > 0) {
    return (
      <span className="rounded-full bg-error/10 px-2 py-0.5 text-xs font-medium text-error">
        Missing: {score.unmetRequired.join(", ")}
      </span>
    );
  }
  if (score.matchPercent === null) return null;
  const style =
    score.matchPercent >= 75
      ? "bg-pine text-paper"
      : score.matchPercent >= 40
        ? "bg-brass text-paper"
        : "bg-line text-ink-soft";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>
      {score.matchPercent}% match
    </span>
  );
}

export function FeedbackApplicantsReport({
  feedback,
  applicants,
  unreadFeedbackIds,
  unreadApplicantIds,
  listingAddress,
  listing,
}: {
  feedback: Feedback[];
  applicants: Applicant[];
  unreadFeedbackIds: string[];
  unreadApplicantIds: string[];
  listingAddress: string;
  listing: ScoringListing;
}) {
  const [feedbackList, setFeedbackList] = useState(feedback);
  const [applicantsList, setApplicantsList] = useState(applicants);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deleteFeedback(id: string) {
    if (!window.confirm("Delete this feedback entry? This can't be undone.")) return;
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("feedback").delete().eq("id", id);
    setDeletingId(null);
    if (!error) {
      setFeedbackList((prev) => prev.filter((item) => item.id !== id));
    }
  }

  async function deleteApplicant(id: string) {
    if (!window.confirm("Delete this applicant? This can't be undone.")) return;
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("applicants").delete().eq("id", id);
    setDeletingId(null);
    if (!error) {
      setApplicantsList((prev) => prev.filter((item) => item.id !== id));
    }
  }

  const hasLandlordPreferences = Boolean(
    listing.landlord_pref_pets ||
      listing.landlord_pref_min_lease_term ||
      listing.landlord_pref_smoking ||
      listing.landlord_pref_employment_verification,
  );

  const rankedApplicants = useMemo(() => {
    const withScores = applicantsList.map((applicant) => ({
      applicant,
      score: scoreApplicant(applicant, listing),
    }));

    if (!hasLandlordPreferences) {
      return withScores;
    }

    return withScores.sort((a, b) => {
      const aUnmet = a.score.unmetRequired.length > 0;
      const bUnmet = b.score.unmetRequired.length > 0;
      if (aUnmet !== bUnmet) return aUnmet ? 1 : -1;

      const aPct = a.score.matchPercent ?? -1;
      const bPct = b.score.matchPercent ?? -1;
      return bPct - aPct;
    });
  }, [applicantsList, listing, hasLandlordPreferences]);

  function exportFeedback() {
    const header = [
      "Date",
      "Name",
      "Email",
      "Phone",
      "Anonymous",
      "Interest level",
      "Price",
      "Condition",
      "Location",
      "Layout",
      "Wants follow-up",
      "Comments",
    ];
    const rows = feedbackList.map((f) => [
      new Date(f.created_at).toLocaleString(),
      f.is_anonymous ? "" : f.name ?? "",
      f.is_anonymous ? "" : f.email ?? "",
      f.is_anonymous ? "" : f.phone ?? "",
      f.is_anonymous ? "Yes" : "No",
      f.interest_level ? INTEREST_LEVEL_LABELS[f.interest_level] ?? f.interest_level : "",
      f.rating_price ?? "",
      f.rating_condition ?? "",
      f.rating_location ?? "",
      f.rating_layout ?? "",
      f.wants_followup ? "Yes" : "No",
      f.comments ?? "",
    ]);
    downloadCsv(`${listingAddress} - feedback.csv`, toCsv([header, ...rows]));
  }

  function exportApplicants() {
    const header = [
      "Date",
      "Name",
      "Email",
      "Phone",
      "Employer",
      "Occupation",
      "Income range",
      "Can provide proof of income",
      "Desired move-in date",
      "Desired lease term",
      "Occupants (total)",
      "Occupants (adults)",
      "Occupants (children)",
      "Has pets",
      "Pet details",
      "Smoker",
      "Reference name",
      "Reference phone",
      "Reference relationship",
      "Match %",
      "Missing landlord requirements",
      "Notes",
    ];
    const rows = rankedApplicants.map(({ applicant: a, score }) => [
      new Date(a.created_at).toLocaleString(),
      a.name,
      a.email,
      a.phone ?? "",
      a.employer ?? "",
      a.occupation ?? "",
      a.income_range ? INCOME_RANGE_LABELS[a.income_range] ?? a.income_range : "",
      a.can_provide_proof_of_income ? "Yes" : "No",
      a.desired_move_in_date ?? "",
      a.desired_lease_term
        ? LEASE_TERM_LABELS[a.desired_lease_term] ?? a.desired_lease_term
        : "",
      a.number_of_occupants ?? "",
      a.number_of_adults ?? "",
      a.number_of_children ?? "",
      a.has_pets ? "Yes" : "No",
      a.pet_details ?? "",
      a.is_smoker ? "Yes" : "No",
      a.reference_name ?? "",
      a.reference_phone ?? "",
      a.reference_relationship ?? "",
      score.matchPercent ?? "",
      score.unmetRequired.join(", "),
      a.notes ?? "",
    ]);
    downloadCsv(`${listingAddress} - applicants.csv`, toCsv([header, ...rows]));
  }

  return (
    <>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-serif text-xl font-medium text-ink">
              Feedback ({feedbackList.length})
            </h2>
            <Button
              variant="secondary"
              onClick={exportFeedback}
              disabled={feedbackList.length === 0}
            >
              Export CSV
            </Button>
          </div>
          <div className="mt-3 space-y-3">
            {feedbackList.length === 0 ? (
              <p className="text-sm text-ink-soft">No feedback yet.</p>
            ) : (
              feedbackList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border border-line bg-paper-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ink">
                        {item.is_anonymous ? "Anonymous" : item.name || "—"}
                      </p>
                      {unreadFeedbackIds.includes(item.id) ? (
                        <span className="rounded-full bg-brass px-2 py-0.5 text-xs font-medium text-paper">
                          New
                        </span>
                      ) : null}
                    </div>
                    {item.interest_level ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          INTEREST_LEVEL_STYLES[item.interest_level] ??
                          "bg-line text-ink-soft"
                        }`}
                      >
                        {INTEREST_LEVEL_LABELS[item.interest_level] ??
                          item.interest_level}
                      </span>
                    ) : null}
                  </div>
                  {!item.is_anonymous && (item.email || item.phone) ? (
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {[item.email, item.phone].filter(Boolean).join(" · ")}
                      {item.wants_followup ? " · Wants follow-up" : ""}
                    </p>
                  ) : null}

                  {item.rating_price ||
                  item.rating_condition ||
                  item.rating_location ||
                  item.rating_layout ? (
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5">
                      <CategoryStars label="Price" value={item.rating_price} />
                      <CategoryStars
                        label="Condition"
                        value={item.rating_condition}
                      />
                      <CategoryStars label="Location" value={item.rating_location} />
                      <CategoryStars label="Layout" value={item.rating_layout} />
                    </div>
                  ) : null}

                  {item.comments ? (
                    <p className="mt-2 text-sm text-ink">{item.comments}</p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => deleteFeedback(item.id)}
                    disabled={deletingId === item.id}
                    className="mt-2 text-xs text-error underline disabled:opacity-60"
                  >
                    {deletingId === item.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-serif text-xl font-medium text-ink">
              Applicants ({rankedApplicants.length})
            </h2>
            <Button
              variant="secondary"
              onClick={exportApplicants}
              disabled={rankedApplicants.length === 0}
            >
              Export CSV
            </Button>
          </div>
          {hasLandlordPreferences && rankedApplicants.length > 1 ? (
            <p className="mt-1 text-xs text-ink-soft">
              Ranked by match to the landlord&apos;s preferences.
            </p>
          ) : null}
          <div className="mt-3 space-y-3">
            {rankedApplicants.length === 0 ? (
              <p className="text-sm text-ink-soft">No applicants yet.</p>
            ) : (
              rankedApplicants.map(({ applicant, score }) => (
                <div
                  key={applicant.id}
                  className="rounded-md border border-line bg-paper-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-ink">{applicant.name}</p>
                      {unreadApplicantIds.includes(applicant.id) ? (
                        <span className="rounded-full bg-brass px-2 py-0.5 text-xs font-medium text-paper">
                          New
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {[applicant.email, applicant.phone].filter(Boolean).join(" · ")}
                  </p>
                  {hasLandlordPreferences ? (
                    <div className="mt-2">
                      <MatchBadge score={score} />
                    </div>
                  ) : null}
                  <p className="mt-2 text-xs text-ink-soft">
                    {[
                      applicant.occupation
                        ? `${applicant.occupation}${applicant.employer ? ` at ${applicant.employer}` : ""}`
                        : applicant.employer,
                      applicant.income_range
                        ? INCOME_RANGE_LABELS[applicant.income_range] ??
                          applicant.income_range
                        : null,
                      applicant.can_provide_proof_of_income
                        ? "Can provide proof of income"
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {[
                      applicant.desired_move_in_date
                        ? `Move in ${new Date(applicant.desired_move_in_date).toLocaleDateString()}`
                        : null,
                      applicant.desired_lease_term
                        ? LEASE_TERM_LABELS[applicant.desired_lease_term] ??
                          applicant.desired_lease_term
                        : null,
                      applicant.number_of_occupants
                        ? `${applicant.number_of_occupants} occupant${applicant.number_of_occupants === 1 ? "" : "s"}${
                            applicant.number_of_adults !== null &&
                            applicant.number_of_children !== null
                              ? ` (${applicant.number_of_adults} adult${applicant.number_of_adults === 1 ? "" : "s"}, ${applicant.number_of_children} child${applicant.number_of_children === 1 ? "" : "ren"})`
                              : ""
                          }`
                        : null,
                      applicant.has_pets ? "Has pets" : null,
                      applicant.is_smoker ? "Smoker" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {applicant.reference_name ? (
                    <p className="mt-1 text-xs text-ink-soft">
                      Reference: {applicant.reference_name}
                      {applicant.reference_relationship
                        ? ` (${applicant.reference_relationship})`
                        : ""}
                      {applicant.reference_phone ? ` · ${applicant.reference_phone}` : ""}
                    </p>
                  ) : null}
                  {applicant.notes ? (
                    <p className="mt-2 text-sm text-ink">{applicant.notes}</p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => deleteApplicant(applicant.id)}
                    disabled={deletingId === applicant.id}
                    className="mt-2 text-xs text-error underline disabled:opacity-60"
                  >
                    {deletingId === applicant.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
