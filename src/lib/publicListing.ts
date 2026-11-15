import { createServiceClient } from "@/lib/supabase/service";
import { isUuid } from "@/lib/validate";

/**
 * The only listing details a visitor's browser ever receives. Seller
 * preferences, landlord preferences, pricing and agency details stay behind
 * the agent's login; the public visit pages never ask for them.
 */
export type PublicListing = {
  id: string;
  agent_id: string;
  listing_type: "sale" | "rental";
  address: string;
  agent_name: string | null;
  agent_email: string | null;
  state: string | null;
  country: string | null;
  custom_questions: unknown;
};

/** Visitor-safe rental settings: only what the applicant is shown on the form. */
export type PublicRentalConfig = Record<string, unknown>;

const PUBLIC_COLUMNS = "id, agent_id, listing_type, address, agent_name, agent_email, state, country, custom_questions";

export async function getPublicListing(id: string): Promise<PublicListing | null> {
  if (!isUuid(id)) return null;
  const { data } = await createServiceClient()
    .from("listings")
    .select(PUBLIC_COLUMNS)
    .eq("id", id)
    .maybeSingle<PublicListing>();
  return data ?? null;
}

/**
 * Whether a sale listing is still taking offers. Anything unexpected
 * (including the column not existing yet) counts as open, so buyers are never
 * wrongly turned away.
 */
export async function getOffersOpen(id: string): Promise<boolean> {
  if (!isUuid(id)) return true;
  const { data, error } = await createServiceClient()
    .from("listings")
    .select("offers_open")
    .eq("id", id)
    .maybeSingle<{ offers_open: boolean | null }>();
  if (error || !data) return true;
  return data.offers_open !== false;
}

/** The agent's saved rental items for a listing, for the apply page. Service role only, never sent in bulk. */
export async function getRentalConfig(id: string): Promise<PublicRentalConfig> {
  if (!isUuid(id)) return {};
  const { data } = await createServiceClient()
    .from("listings")
    .select("rental_config")
    .eq("id", id)
    .maybeSingle<{ rental_config: PublicRentalConfig | null }>();
  const { ranking: _ranking, ...visible } = (data?.rental_config ?? {}) as PublicRentalConfig;
  void _ranking;
  return visible;
}
