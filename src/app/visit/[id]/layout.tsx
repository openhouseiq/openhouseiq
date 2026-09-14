import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .returns<Listing[]>()
    .maybeSingle();

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
