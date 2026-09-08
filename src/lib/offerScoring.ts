import type { Listing, Offer } from "@/lib/types";

const PRICE_WEIGHTS: Record<string, number> = {
  not_a_priority: 0,
  somewhat_important: 1,
  important: 2,
  very_important: 3,
  top_priority: 4,
};

const LEVEL_WEIGHTS: Record<string, number> = {
  no_preference: 0,
  preferred: 1,
  required: 3,
};

const SETTLEMENT_MATCH_WEIGHT = 2;

export type OfferScore = {
  /** 0-100, or null if the seller hasn't set any preferences to score against. */
  matchPercent: number | null;
  /** Human-readable preferences this offer fails to meet (seller marked "required"). */
  unmetRequired: string[];
};

export function scoreOffer(
  offer: Pick<Offer, "offer_amount" | "financing_type" | "settlement_term" | "waive_inspection">,
  listing: Pick<
    Listing,
    | "price"
    | "seller_pref_price"
    | "seller_pref_settlement"
    | "seller_pref_waive_inspection"
    | "seller_pref_finance_approved"
    | "seller_pref_cash_buyer"
  >,
): OfferScore {
  let score = 0;
  let maxScore = 0;
  const unmetRequired: string[] = [];

  const priceWeight = PRICE_WEIGHTS[listing.seller_pref_price ?? ""] ?? 0;
  if (priceWeight > 0 && listing.price > 0) {
    maxScore += priceWeight;
    const ratio = Number(offer.offer_amount) / Number(listing.price);
    // 80% of asking -> 0, 120% of asking -> 1, clamped in between.
    const priceScore = Math.max(0, Math.min(1, (ratio - 0.8) / 0.4));
    score += priceWeight * priceScore;
  }

  if (listing.seller_pref_settlement && listing.seller_pref_settlement !== "flexible") {
    maxScore += SETTLEMENT_MATCH_WEIGHT;
    if (offer.settlement_term === listing.seller_pref_settlement) {
      score += SETTLEMENT_MATCH_WEIGHT;
    }
  }

  const waiveWeight = LEVEL_WEIGHTS[listing.seller_pref_waive_inspection ?? ""] ?? 0;
  if (waiveWeight > 0) {
    maxScore += waiveWeight;
    if (offer.waive_inspection) {
      score += waiveWeight;
    } else if (listing.seller_pref_waive_inspection === "required") {
      unmetRequired.push("Willing to waive inspection");
    }
  }

  const financeWeight = LEVEL_WEIGHTS[listing.seller_pref_finance_approved ?? ""] ?? 0;
  if (financeWeight > 0) {
    maxScore += financeWeight;
    const hasApprovedFinance =
      offer.financing_type === "cash" || offer.financing_type === "pre_approved";
    if (hasApprovedFinance) {
      score += financeWeight;
    } else if (listing.seller_pref_finance_approved === "required") {
      unmetRequired.push("Finance approved");
    }
  }

  const cashWeight = LEVEL_WEIGHTS[listing.seller_pref_cash_buyer ?? ""] ?? 0;
  if (cashWeight > 0) {
    maxScore += cashWeight;
    if (offer.financing_type === "cash") {
      score += cashWeight;
    } else if (listing.seller_pref_cash_buyer === "required") {
      unmetRequired.push("Cash buyer");
    }
  }

  const matchPercent = maxScore > 0 ? Math.round((score / maxScore) * 100) : null;

  return { matchPercent, unmetRequired };
}
