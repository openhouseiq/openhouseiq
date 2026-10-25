import { notFound } from "next/navigation";
import { getPublicListing, getRentalConfig } from "@/lib/publicListing";
import { getEnabledRentalForm } from "@/lib/rentalForms";
import { agentConfigComplete } from "@/lib/rentalForms/answers";
import { RentalApplicationForm } from "@/components/rentalForms/RentalApplicationForm";
import { getAgentPhotoUrl } from "@/lib/agent-photo";
import { VisitLayout } from "@/components/visit/VisitLayout";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getPublicListing(id);

  if (!listing) {
    notFound();
  }

  if (listing.listing_type !== "rental") {
    notFound();
  }

  const agentPhotoUrl = await getAgentPhotoUrl(listing.agent_id);
  const form = getEnabledRentalForm(listing.state);
  const config = form ? await getRentalConfig(listing.id) : {};
  const open = form !== null && agentConfigComplete(form, config);

  return (
    <VisitLayout>
      <h2 className="mb-6 text-center font-serif text-2xl font-medium text-ink">
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
      {form && open ? (
        <RentalApplicationForm
          listingId={listing.id}
          state={form.state}
          config={config}
        />
      ) : (
        <div className="rounded-md border border-line bg-paper-card p-5 text-center text-sm text-ink">
          <p className="font-medium">Applications are not open for this property yet.</p>
          <p className="mt-2 text-ink-soft">
            Please speak to the agent
            {listing.agent_email ? ` at ${listing.agent_email}` : ""} about how to apply.
          </p>
        </div>
      )}
    </VisitLayout>
  );
}
