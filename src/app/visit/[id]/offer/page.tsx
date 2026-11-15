import { notFound } from "next/navigation";
import { getOffersOpen, getPublicListing } from "@/lib/publicListing";
import { getAgentPhotoUrl } from "@/lib/agent-photo";
import { VisitLayout } from "@/components/visit/VisitLayout";
import { OfferForm } from "./OfferForm";

export default async function OfferPage({
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
    getOffersOpen(listing.id),
  ]);

  return (
    <VisitLayout>
      <p className="text-center text-sm text-ink-soft">Make an offer</p>
      <h2 className="mb-6 mt-1 text-center font-serif text-2xl font-medium text-ink">
        {listing.address}
      </h2>
      {listing.agent_name ? (
        <div className="mb-6 flex flex-col items-center">
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
      ) : (
        <div className="mb-6" />
      )}
      {offersOpen ? (
        <OfferForm listingId={listing.id} country={listing.country} />
      ) : (
        <div className="rounded-md border border-line bg-paper-card p-5 text-center">
          <p className="font-serif text-lg text-ink">This property is no longer taking offers.</p>
          <p className="mt-1 text-sm text-ink-soft">
            Please contact the agent{listing.agent_email ? ` at ${listing.agent_email}` : ""} if you have questions.
          </p>
        </div>
      )}
    </VisitLayout>
  );
}
