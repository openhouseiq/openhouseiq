export type PriceImportance =
  | "not_a_priority"
  | "somewhat_important"
  | "important"
  | "very_important"
  | "top_priority";

export type SettlementPreference =
  | "asap"
  | "30_days"
  | "45_days"
  | "60_days"
  | "90_plus_days"
  | "flexible";

export type PreferenceLevel = "no_preference" | "preferred" | "required";

export type FinancePreference =
  | "finance_preferred"
  | "finance_required"
  | "cash_preferred"
  | "cash_required";

export type LandSizeUnit = "sqm" | "ha" | "acres";

export type ListingType = "sale" | "rental";

export type PetsPreference = "no_preference" | "not_allowed" | "allowed";

export type SmokingPreference = "no_preference" | "not_allowed" | "allowed";

export type LeaseTerm = "month_to_month" | "6_months" | "12_months" | "24_months";

export type LeaseTermPreference = LeaseTerm | "flexible";

export type IncomeRange =
  | "under_50k"
  | "50k_75k"
  | "75k_100k"
  | "100k_150k"
  | "150k_plus";

export type Listing = {
  id: string;
  agent_id: string;
  agency_id: string | null;
  listing_type: ListingType;
  address: string;
  price: number;
  description: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  car_spaces: number | null;
  land_size: number | null;
  land_size_unit: LandSizeUnit | null;
  agent_name: string | null;
  agent_email: string | null;
  seller_pref_price: PriceImportance | null;
  seller_pref_settlement: SettlementPreference | null;
  seller_pref_waive_inspection: PreferenceLevel | null;
  seller_pref_finance: FinancePreference | null;
  landlord_pref_pets: PetsPreference | null;
  landlord_pref_min_lease_term: LeaseTermPreference | null;
  landlord_pref_smoking: SmokingPreference | null;
  landlord_pref_employment_verification: PreferenceLevel | null;
  created_at: string;
  updated_at: string;
};

export type InterestLevel =
  | "not_interested"
  | "considering"
  | "very_interested"
  | "ready_to_offer";

export type PurchaseTimeframe =
  | "immediately"
  | "one_to_three_months"
  | "three_to_six_months"
  | "six_plus_months"
  | "just_browsing";

export type Feedback = {
  id: string;
  listing_id: string;
  is_anonymous: boolean;
  name: string | null;
  email: string | null;
  phone: string | null;
  rating: number | null;
  comments: string | null;
  interest_level: InterestLevel | null;
  rating_price: number | null;
  rating_condition: number | null;
  rating_location: number | null;
  rating_layout: number | null;
  pre_approved: boolean | null;
  working_with_agent: boolean | null;
  purchase_timeframe: PurchaseTimeframe | null;
  wants_followup: boolean | null;
  read_at: string | null;
  created_at: string;
};

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid";

export type Subscription = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  price_id: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type AgencyStatus =
  | "incomplete"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete_expired"
  | "unpaid";

export type Agency = {
  id: string;
  name: string;
  owner_user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  price_id: string | null;
  billing_interval: "month" | "year" | null;
  seats: number;
  pending_seats: number | null;
  status: AgencyStatus;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

export type AgencyMemberStatus = "invited" | "active" | "removed";

export type AgencyMember = {
  id: string;
  agency_id: string;
  user_id: string | null;
  email: string;
  status: AgencyMemberStatus;
  invited_at: string;
  joined_at: string | null;
  removed_at: string | null;
};

// Agencies of up to 20 agents can sign up and manage themselves; larger
// agencies are quoted individually.
export const AGENCY_MAX_SELF_SERVE_SEATS = 20;

export const AGENCY_BASE_PRICE = { month: 39, year: 390 } as const;

export const AGENCY_DISCOUNT_TIERS: { minSeats: number; maxSeats: number; discount: number }[] = [
  { minSeats: 1, maxSeats: 2, discount: 0 },
  { minSeats: 3, maxSeats: 6, discount: 0.1 },
  { minSeats: 7, maxSeats: 19, discount: 0.15 },
  { minSeats: 20, maxSeats: 20, discount: 0.2 },
];

export function agencyDiscountForSeats(seats: number): number {
  const tier = AGENCY_DISCOUNT_TIERS.find((t) => seats >= t.minSeats && seats <= t.maxSeats);
  if (tier) return tier.discount;
  return seats > AGENCY_MAX_SELF_SERVE_SEATS ? 0.2 : 0;
}

export function agencyPricePerAgent(seats: number, interval: "month" | "year"): number {
  return Math.round(AGENCY_BASE_PRICE[interval] * (1 - agencyDiscountForSeats(seats)) * 100) / 100;
}

export function agencyTotalPrice(seats: number, interval: "month" | "year"): number {
  return Math.round(agencyPricePerAgent(seats, interval) * seats * 100) / 100;
}

export type Offer = {
  id: string;
  listing_id: string;
  name: string;
  email: string;
  phone: string | null;
  offer_amount: number;
  financing_type: string | null;
  settlement_term: string | null;
  waive_inspection: boolean;
  notes: string | null;
  read_at: string | null;
  created_at: string;
};

export type Applicant = {
  id: string;
  listing_id: string;
  name: string;
  email: string;
  phone: string | null;
  employer: string | null;
  occupation: string | null;
  income_range: IncomeRange | null;
  can_provide_proof_of_income: boolean;
  desired_move_in_date: string | null;
  desired_lease_term: LeaseTerm | null;
  has_pets: boolean;
  pet_details: string | null;
  number_of_occupants: number | null;
  number_of_adults: number | null;
  number_of_children: number | null;
  is_smoker: boolean;
  reference_name: string | null;
  reference_phone: string | null;
  reference_relationship: string | null;
  notes: string | null;
  read_at: string | null;
  created_at: string;
};

export type ProductFeedback = {
  id: string;
  user_id: string;
  overall_rating: number;
  liked_most: string | null;
  biggest_frustration: string | null;
  would_recommend: boolean | null;
  additional_comments: string | null;
  created_at: string;
};

export type ContactMessage = {
  id: string;
  user_id: string;
  message: string;
  read_at: string | null;
  reply_text: string | null;
  replied_at: string | null;
  created_at: string;
};
