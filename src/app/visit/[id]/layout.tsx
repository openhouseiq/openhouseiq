import type { Metadata } from "next";
import { getPublicListing } from "@/lib/publicListing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getPublicListing(id);

  if (!listing) {
    return { robots: { index: false, follow: false } };
  }

  const description = listing.agent_name
    ? `Hosted by ${listing.agent_name}. Leave feedback or submit an offer.`
    : "Leave feedback or submit an offer.";

  return {
    title: listing.address,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: listing.address,
      description,
    },
  };
}

export default function VisitIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
