import type { Listing, Offer } from "@/lib/types";

const PRICE_WEIGHTS: Record<string, number> = {
  not_a_priority: 0,
  somewhat_important: 1,
  important: 2,
  very_important: 3,
  top_priority: 4,
};

const PRICE_LABELS: Record<string, string> = {
  somewhat_important: "Somewhat important",
  important: "Important",
  very_important: "Very important",
  top_priority: "Top priority",
};

const LEVEL_WEIGHTS: Record<string, number> = {
  no_preference: 0,
  preferred: 1,
  required: 3,
};

const SETTLEMENT_MATCH_WEIGHT = 2;

const SETTLEMENT_LABELS: Record<string, string> = {
  asap: "As soon as possible",
  "30_days": "30 days",
  "45_days": "45 days",
  "60_days": "60 days",
  "90_plus_days": "90+ days",
};

/** How many conditions an offer can carry: finance, building & pest, sale of the buyer's home. */
const CONDITION_COUNT = 3;

export type ScoringOffer = Pick<
  Offer,
  "offer_amount" | "financing_type" | "settlement_term" | "waive_inspection"
> &
  Partial<Pick<Offer, "subject_to_finance" | "subject_to_sale">>;

export type ScoringListing = Pick<
  Listing,
  | "price"
  | "seller_pref_price"
  | "seller_pref_settlement"
  | "seller_pref_waive_inspection"
  | "seller_pref_finance"
> &
  Partial<Pick<Listing, "seller_pref_conditions">>;

export type OfferScore = {
  /** 0-100, or null if the seller hasn't set any preferences to score against. */
  matchPercent: number | null;
  /** Human-readable preferences this offer fails to meet (seller marked "required"). */
  unmetRequired: string[];
};

/**
 * The conditions an offer carries, as short labels. Offers made before the
 * conditions checklist existed have no "subject to finance" answer, so a buyer
 * who said they were arranging finance is counted as subject to finance.
 */
export function offerConditions(
  offer: Pick<ScoringOffer, "financing_type" | "waive_inspection" | "subject_to_finance" | "subject_to_sale">,
): string[] {
  const conditions: string[] = [];
  const finance =
    offer.subject_to_finance ?? (offer.financing_type === "financing" ? true : false);
  if (finance) conditions.push("Finance");
  if (!offer.waive_inspection) conditions.push("Building & pest");
  if (offer.subject_to_sale) conditions.push("Sale of home");
  return conditions;
}

export function scoreOffer(offer: ScoringOffer, listing: ScoringListing): OfferScore {
  let score = 0;
  let maxScore = 0;
  const unmetRequired: string[] = [];

  const priceWeight = PRICE_WEIGHTS[listing.seller_pref_price ?? ""] ?? 0;
  if (priceWeight > 0 && listing.price > 0) {
    maxScore += priceWeight;
    const ratio = Number(offer.offer_amount) / Number(listing.price);
    // 80% of asking -> 0, full asking price (or more) -> 1, clamped in between.
    const priceScore = Math.max(0, Math.min(1, (ratio - 0.8) / 0.2));
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

  const financePref = listing.seller_pref_finance;
  if (financePref) {
    const isRequired = financePref.endsWith("required");
    const wantsCashOnly = financePref.startsWith("cash");
    const financeWeight = isRequired ? LEVEL_WEIGHTS.required : LEVEL_WEIGHTS.preferred;
    maxScore += financeWeight;
    const satisfied = wantsCashOnly
      ? offer.financing_type === "cash"
      : offer.financing_type === "cash" || offer.financing_type === "pre_approved";
    if (satisfied) {
      score += financeWeight;
    } else if (isRequired) {
      unmetRequired.push(wantsCashOnly ? "Cash buyer" : "Finance approved");
    }
  }

  const conditionsWeight = LEVEL_WEIGHTS[listing.seller_pref_conditions ?? ""] ?? 0;
  if (conditionsWeight > 0) {
    maxScore += conditionsWeight;
    const count = offerConditions(offer).length;
    // No conditions -> full marks, every condition takes away a third.
    score += conditionsWeight * (1 - count / CONDITION_COUNT);
    if (listing.seller_pref_conditions === "required" && count > 0) {
      unmetRequired.push("Unconditional");
    }
  }

  const matchPercent = maxScore > 0 ? Math.round((score / maxScore) * 100) : null;

  return { matchPercent, unmetRequired };
}

export type SellerPriority = { key: string; label: string; weight: number };

/**
 * The seller's preferences that count towards the match, most important first
 * (ordered by how much each one counts in the score above).
 */
export function sellerPriorities(listing: Omit<ScoringListing, "price">): SellerPriority[] {
  const list: SellerPriority[] = [];

  const priceWeight = PRICE_WEIGHTS[listing.seller_pref_price ?? ""] ?? 0;
  if (priceWeight > 0) {
    list.push({ key: "price", label: `Price: ${PRICE_LABELS[listing.seller_pref_price ?? ""]}`, weight: priceWeight });
  }

  if (listing.seller_pref_settlement && listing.seller_pref_settlement !== "flexible") {
    list.push({
      key: "settlement",
      label: `Settlement ${SETTLEMENT_LABELS[listing.seller_pref_settlement] ?? listing.seller_pref_settlement}`,
      weight: SETTLEMENT_MATCH_WEIGHT,
    });
  }

  const financePref = listing.seller_pref_finance;
  if (financePref) {
    const required = financePref.endsWith("required");
    const cash = financePref.startsWith("cash");
    list.push({
      key: "finance",
      label: `${cash ? "Cash buyer" : "Finance approved"}${required ? " (required)" : ""}`,
      weight: required ? LEVEL_WEIGHTS.required : LEVEL_WEIGHTS.preferred,
    });
  }

  const conditions = listing.seller_pref_conditions;
  if (conditions && conditions !== "no_preference") {
    list.push({
      key: "conditions",
      label: conditions === "required" ? "Unconditional only" : "Few conditions",
      weight: LEVEL_WEIGHTS[conditions],
    });
  }

  const waive = listing.seller_pref_waive_inspection;
  if (waive && waive !== "no_preference") {
    list.push({
      key: "waive",
      label: `No building & pest${waive === "required" ? " (required)" : ""}`,
      weight: LEVEL_WEIGHTS[waive],
    });
  }

  // Stable sort: equal weights keep the order above.
  return list
    .map((p, i) => ({ p, i }))
    .sort((a, b) => b.p.weight - a.p.weight || a.i - b.i)
    .map(({ p }) => p);
}
