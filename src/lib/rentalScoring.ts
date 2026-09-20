import type { Applicant, Listing } from "@/lib/types";

const REQUIRED_WEIGHT = 3;
const LEASE_TERM_WEIGHT = 2;

const EMPLOYMENT_WEIGHTS: Record<string, number> = {
  no_preference: 0,
  preferred: 1,
  required: 3,
};

const LEASE_TERM_MONTHS: Record<string, number> = {
  month_to_month: 0,
  "6_months": 6,
  "12_months": 12,
  "24_months": 24,
};

export type ApplicantScore = {
  /** 0-100, or null if the landlord hasn't set any preferences to score against. */
  matchPercent: number | null;
  /** Human-readable preferences this applicant fails to meet (landlord marked "required" / "not allowed"). */
  unmetRequired: string[];
};

export function scoreApplicant(
  applicant: Pick<
    Applicant,
    | "has_pets"
    | "is_smoker"
    | "desired_lease_term"
    | "can_provide_proof_of_income"
  >,
  listing: Pick<
    Listing,
    | "landlord_pref_pets"
    | "landlord_pref_min_lease_term"
    | "landlord_pref_smoking"
    | "landlord_pref_employment_verification"
  >,
): ApplicantScore {
  let score = 0;
  let maxScore = 0;
  const unmetRequired: string[] = [];

  if (listing.landlord_pref_pets === "not_allowed") {
    maxScore += REQUIRED_WEIGHT;
    if (!applicant.has_pets) {
      score += REQUIRED_WEIGHT;
    } else {
      unmetRequired.push("No pets");
    }
  }

  if (listing.landlord_pref_smoking === "not_allowed") {
    maxScore += REQUIRED_WEIGHT;
    if (!applicant.is_smoker) {
      score += REQUIRED_WEIGHT;
    } else {
      unmetRequired.push("Non-smoker");
    }
  }

  if (
    listing.landlord_pref_min_lease_term &&
    listing.landlord_pref_min_lease_term !== "flexible"
  ) {
    maxScore += LEASE_TERM_WEIGHT;
    const minMonths = LEASE_TERM_MONTHS[listing.landlord_pref_min_lease_term] ?? 0;
    const desiredMonths = LEASE_TERM_MONTHS[applicant.desired_lease_term ?? ""] ?? 0;
    if (desiredMonths >= minMonths) {
      score += LEASE_TERM_WEIGHT;
    }
  }

  const employmentWeight =
    EMPLOYMENT_WEIGHTS[listing.landlord_pref_employment_verification ?? ""] ?? 0;
  if (employmentWeight > 0) {
    maxScore += employmentWeight;
    if (applicant.can_provide_proof_of_income) {
      score += employmentWeight;
    } else if (listing.landlord_pref_employment_verification === "required") {
      unmetRequired.push("Proof of income");
    }
  }

  const matchPercent = maxScore > 0 ? Math.round((score / maxScore) * 100) : null;

  return { matchPercent, unmetRequired };
}
