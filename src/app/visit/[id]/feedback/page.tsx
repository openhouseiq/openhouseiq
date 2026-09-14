import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgentPhotoUrl } from "@/lib/agent-photo";
import { VisitLayout } from "@/components/visit/VisitLayout";
import { FeedbackForm } from "./FeedbackForm";
import type { Listing } from "@/lib/types";

export default async function FeedbackPage({
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
      <FeedbackForm listingId={listing.id} />
    </VisitLayout>
  );
}
