import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListingPhotoUrls } from "@/lib/listing-photos";
import { VisitLayout } from "@/components/visit/VisitLayout";
import { Button } from "@/components/ui/Button";
import type { Listing } from "@/lib/types";

export default async function VisitLandingPage({
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
      <p className="text-center text-sm text-ink-soft">Welcome to</p>
      <h2 className="mt-1 text-center font-serif text-2xl font-medium text-ink">
        {listing.address}
      </h2>
      {listing.agent_name ? (
        <p className="mt-2 text-center text-xs text-ink-soft">
          Hosted by {listing.agent_name}
          {listing.agent_email ? ` · ${listing.agent_email}` : ""}
        </p>
      ) : null}

      <div className="mt-8 space-y-3">
        <Link href={`/visit/${listing.id}/feedback`} className="block">
          <Button variant="primary" className="w-full">
            Provide feedback
          </Button>
        </Link>
        <Link href={`/visit/${listing.id}/offer`} className="block">
          <Button variant="secondary" className="w-full">
            Submit an offer
          </Button>
        </Link>
      </div>
    </VisitLayout>
  );
}
