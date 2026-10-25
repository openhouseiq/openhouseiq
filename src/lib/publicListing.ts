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
};

/** Visitor-safe rental settings: only what the applicant is shown on the form. */
export type PublicRentalConfig = Record<string, unknown>;

const PUBLIC_COLUMNS = "id, agent_id, listing_type, address, agent_name, agent_email, state";

export async function getPublicListing(id: string): Promise<PublicListing | null> {
  if (!isUuid(id)) return null;
  const { data } = await createServiceClient()
    .from("listings")
    .select(PUBLIC_COLUMNS)
    .eq("id", id)
    .maybeSingle<PublicListing>();
  return data ?? null;
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
