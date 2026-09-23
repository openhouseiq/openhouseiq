import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentPhotoUrl } from "@/lib/agent-photo";
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

  const agentPhotoUrl = await getAgentPhotoUrl(listing.agent_id);

  return (
    <VisitLayout>
      <p className="text-center text-sm text-ink-soft">Welcome to</p>
      <h2 className="mt-1 text-center font-serif text-2xl font-medium text-ink">
        {listing.address}
      </h2>
      {listing.agent_name ? (
        <div className="mt-2 flex flex-col items-center">
          {agentPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={agentPhotoUrl}
              alt={listing.agent_name}
              className="mb-2 h-16 w-16 rounded-full border border-line object-cover"
            />
          ) : null}
          <p className="text-center text-xs text-ink-soft">
            Hosted by {listing.agent_name}
            {listing.agent_email ? ` · ${listing.agent_email}` : ""}
          </p>
        </div>
      ) : null}

      <div className="mt-8 space-y-3">
        <Link href={`/visit/${listing.id}/feedback`} className="block">
          <Button variant="primary" className="w-full">
            Provide feedback
          </Button>
        </Link>
        {listing.listing_type === "rental" ? (
          <Link href={`/visit/${listing.id}/apply`} className="block">
            <Button variant="primary" className="w-full">
              Apply to rent
            </Button>
          </Link>
        ) : (
          <Link href={`/visit/${listing.id}/offer`} className="block">
            <Button variant="primary" className="w-full">
              Submit an offer
            </Button>
          </Link>
        )}
      </div>
    </VisitLayout>
  );
}
