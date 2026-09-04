import type { SupabaseClient } from "@supabase/supabase-js";
import type { ListingPhoto } from "./types";

export async function getListingPhotoUrls(
  supabase: SupabaseClient,
  listingId: string,
): Promise<string[]> {
  const { data: photos } = await supabase
    .from("listing_photos")
    .select("*")
    .eq("listing_id", listingId)
    .order("position")
    .returns<ListingPhoto[]>();

  return (photos ?? []).map(
    (photo) =>
      supabase.storage.from("listing-photos").getPublicUrl(photo.storage_path).data
        .publicUrl,
  );
}
