export type Listing = {
  id: string;
  agent_id: string;
  address: string;
  price: number;
  description: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  agent_name: string | null;
  agent_email: string | null;
  created_at: string;
  updated_at: string;
};

export type ListingPhoto = {
  id: string;
  listing_id: string;
  storage_path: string;
  position: number;
  created_at: string;
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
