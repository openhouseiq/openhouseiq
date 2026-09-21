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
  listing_type: ListingType;
  address: string;
  price: number;
  description: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  car_spaces: number | null;
  sqft: number | null;
  agent_name: string | null;
  agent_email: string | null;
  seller_pref_price: PriceImportance | null;
  seller_pref_settlement: SettlementPreference | null;
  seller_pref_waive_inspection: PreferenceLevel | null;
  seller_pref_finance_approved: PreferenceLevel | null;
  seller_pref_cash_buyer: PreferenceLevel | null;
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
