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
};

const PUBLIC_COLUMNS = "id, agent_id, listing_type, address, agent_name, agent_email";

export async function getPublicListing(id: string): Promise<PublicListing | null> {
  if (!isUuid(id)) return null;
  const { data } = await createServiceClient()
    .from("listings")
    .select(PUBLIC_COLUMNS)
    .eq("id", id)
    .maybeSingle<PublicListing>();
  return data ?? null;
}
