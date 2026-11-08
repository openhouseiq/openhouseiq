// Turns a visitor's feedback or offer into one plain "CRM record" that any CRM
// connector can send: who they are, which listing, and a readable summary.

export type CrmKind = "feedback" | "offer";

export type CrmListing = { id: string; address: string | null };

export type CrmFeedbackRow = {
  id: string;
  is_anonymous: boolean;
  name: string | null;
  email: string | null;
  phone: string | null;
  comments: string | null;
  interest_level: string | null;
  rating_price: number | null;
  rating_condition: number | null;
  rating_location: number | null;
  rating_layout: number | null;
  pre_approved: boolean | null;
  working_with_agent: boolean | null;
  purchase_timeframe: string | null;
  wants_followup: boolean | null;
  created_at: string;
};

export type CrmOfferRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  offer_amount: number | string;
  financing_type: string | null;
  settlement_term: string | null;
  waive_inspection: boolean;
  notes: string | null;
  created_at: string;
};

export type CrmRecord = {
  /** Stable id so a CRM can recognise a repeat send, e.g. "ohh-offer-<uuid>". */
  originalId: string;
  kind: CrmKind;
  createdAt: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  listingAddress: string;
  subject: string;
  body: string;
};

const INTEREST: Record<string, string> = {
  not_interested: "Not interested",
  considering: "Considering",
  very_interested: "Very interested",
  ready_to_offer: "Ready to make an offer",
};
const TIMEFRAME: Record<string, string> = {
  immediately: "Immediately",
  one_to_three_months: "1–3 months",
  three_to_six_months: "3–6 months",
  six_plus_months: "6+ months",
  just_browsing: "Just browsing",
};
const FINANCE: Record<string, string> = {
  cash: "Cash",
  pre_approved: "Pre-approved finance",
  financing: "Arranging finance",
};
const SETTLEMENT: Record<string, string> = {
  asap: "As soon as possible",
  "30_days": "30 days",
  "45_days": "45 days",
  "60_days": "60 days",
  "90_plus_days": "90+ days",
  flexible: "Flexible",
};

const yesNo = (v: boolean | null | undefined) => (v === true ? "Yes" : v === false ? "No" : null);

function lines(pairs: [string, string | null | undefined][]): string {
  return pairs
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

function money(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return Number.isFinite(n) ? `$${n.toLocaleString("en-AU", { maximumFractionDigits: 0 })}` : String(amount);
}

/** Null when there's nobody to add to a CRM (anonymous feedback). */
export function feedbackRecord(row: CrmFeedbackRow, listing: CrmListing): CrmRecord | null {
  if (row.is_anonymous || !row.name || (!row.email && !row.phone)) return null;
  const address = listing.address ?? "your listing";
  const ratings = [
    row.rating_price && `price ${row.rating_price}/5`,
    row.rating_condition && `condition ${row.rating_condition}/5`,
    row.rating_location && `location ${row.rating_location}/5`,
    row.rating_layout && `layout ${row.rating_layout}/5`,
  ].filter(Boolean);
  return {
    originalId: `ohh-feedback-${row.id}`,
    kind: "feedback",
    createdAt: row.created_at,
    fullName: row.name,
    email: row.email,
    phone: row.phone,
    listingAddress: address,
    subject: `Open home feedback – ${address}`,
    body: [
      `Feedback left at the open home for ${address} via Open Home Hero.`,
      "",
      lines([
        ["Interest", row.interest_level ? INTEREST[row.interest_level] ?? row.interest_level : null],
        ["Buying timeframe", row.purchase_timeframe ? TIMEFRAME[row.purchase_timeframe] ?? row.purchase_timeframe : null],
        ["Pre-approved", yesNo(row.pre_approved)],
        ["Working with another agent", yesNo(row.working_with_agent)],
        ["Wants a follow-up", yesNo(row.wants_followup)],
        ["Ratings", ratings.length ? ratings.join(", ") : null],
        ["Comments", row.comments],
      ]),
    ].join("\n"),
  };
}

export function offerRecord(row: CrmOfferRow, listing: CrmListing): CrmRecord {
  const address = listing.address ?? "your listing";
  return {
    originalId: `ohh-offer-${row.id}`,
    kind: "offer",
    createdAt: row.created_at,
    fullName: row.name,
    email: row.email,
    phone: row.phone,
    listingAddress: address,
    subject: `Offer ${money(row.offer_amount)} – ${address}`,
    body: [
      `Offer submitted for ${address} via Open Home Hero.`,
      "",
      lines([
        ["Offer amount", money(row.offer_amount)],
        ["Finance", row.financing_type ? FINANCE[row.financing_type] ?? row.financing_type : null],
        ["Settlement", row.settlement_term ? SETTLEMENT[row.settlement_term] ?? row.settlement_term : null],
        ["Willing to waive building & pest", yesNo(row.waive_inspection)],
        ["Notes", row.notes],
      ]),
    ].join("\n"),
  };
}
