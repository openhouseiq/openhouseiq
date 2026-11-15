import Link from "next/link";
import { notFound } from "next/navigation";
import { getOffersOpen, getPublicListing } from "@/lib/publicListing";
import { getAgentPhotoUrl } from "@/lib/agent-photo";
import { VisitLayout } from "@/components/visit/VisitLayout";
import { Button } from "@/components/ui/Button";

export default async function VisitLandingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getPublicListing(id);

  if (!listing) {
    notFound();
  }

  const [agentPhotoUrl, offersOpen] = await Promise.all([
    getAgentPhotoUrl(listing.agent_id),
    listing.listing_type === "sale" ? getOffersOpen(listing.id) : Promise.resolve(true),
  ]);

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
            Sign in &amp; give feedback
          </Button>
        </Link>
        {listing.listing_type === "rental" ? (
          <Link href={`/visit/${listing.id}/apply`} className="block">
            <Button variant="primary" className="w-full">
              Apply to rent
            </Button>
          </Link>
        ) : offersOpen ? (
          <Link href={`/visit/${listing.id}/offer`} className="block">
            <Button variant="primary" className="w-full">
              Submit an offer
            </Button>
          </Link>
        ) : (
          <p className="rounded-md border border-line px-4 py-3 text-center text-sm text-ink-soft">
            This property is no longer taking offers.
          </p>
        )}
      </div>
    </VisitLayout>
  );
}
