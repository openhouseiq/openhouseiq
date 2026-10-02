import type { SupabaseClient } from "@supabase/supabase-js";

/** The agency a user currently belongs to (as owner or active member), or null. */
export async function getUserCurrentAgencyId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase.rpc("user_current_agency_id", { uid: userId });
  return (data as string | null) ?? null;
}

/** Whether a listing belongs to the user — directly, or via a shared agency. */
export function canAccessListing(
  listing: { agent_id: string; agency_id: string | null },
  userId: string,
  userAgencyId: string | null,
): boolean {
  if (listing.agency_id) {
    return listing.agency_id === userAgencyId;
  }
  return listing.agent_id === userId;
}
