import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListingPhotoUrls } from "@/lib/listing-photos";
import { VisitLayout } from "@/components/visit/VisitLayout";
import { OfferForm } from "./OfferForm";
import type { Listing } from "@/lib/types";

export default async function OfferPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .returns<Listing[]>()
    .maybeSingle();

  if (!listing) {
    notFound();
  }

  const photoUrls = await getListingPhotoUrls(supabase, listing.id);

  return (
    <VisitLayout photoUrls={photoUrls}>
      <p className="text-center text-sm text-ink-soft">{listing.address}</p>
      {listing.agent_name ? (
        <p className="mb-6 text-center text-xs text-ink-soft">
          Hosted by {listing.agent_name}
          {listing.agent_email ? ` · ${listing.agent_email}` : ""}
        </p>
      ) : (
        <div className="mb-6" />
      )}
      <OfferForm listingId={listing.id} />
    </VisitLayout>
  );
}
