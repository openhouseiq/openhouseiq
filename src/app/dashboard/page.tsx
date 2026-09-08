import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/Button";
import { DeleteListingButton } from "./listings/[id]/DeleteListingButton";
import type { Listing } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";
  const firstName = fullName.split(" ")[0] || user.email || "there";

  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Listing[]>();

  const listingIds = (listings ?? []).map((listing) => listing.id);
  const unreadCounts = new Map<string, number>();

  if (listingIds.length > 0) {
    const [{ data: unreadFeedback }, { data: unreadOffers }] = await Promise.all([
      supabase
        .from("feedback")
        .select("listing_id")
        .in("listing_id", listingIds)
        .is("read_at", null),
      supabase
        .from("offers")
        .select("listing_id")
        .in("listing_id", listingIds)
        .is("read_at", null),
    ]);

    for (const row of [...(unreadFeedback ?? []), ...(unreadOffers ?? [])]) {
      unreadCounts.set(row.listing_id, (unreadCounts.get(row.listing_id) ?? 0) + 1);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader agentLabel={fullName || user.email || ""} />

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-serif text-3xl font-medium text-ink">
            Welcome, {firstName}
          </h1>
          <Link href="/dashboard/listings/new">
            <Button variant="primary">+ New listing</Button>
          </Link>
        </div>

        {!listings || listings.length === 0 ? (
          <div className="mt-8 rounded-md border border-line bg-paper-card px-6 py-16 text-center">
            <p className="text-sm text-ink-soft">No listings yet</p>
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {listings.map((listing) => (
              <li
                key={listing.id}
                className="flex items-center justify-between rounded-md border border-line bg-paper-card px-6 py-4 hover:border-pine"
              >
                <Link href={`/dashboard/listings/${listing.id}`} className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">{listing.address}</p>
                    {unreadCounts.get(listing.id) ? (
                      <span className="rounded-full bg-brass px-2 py-0.5 text-xs font-medium text-paper">
                        {unreadCounts.get(listing.id)} new
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-ink-soft">
                    ${Number(listing.price).toLocaleString()}
                    {listing.bedrooms ? ` · ${listing.bedrooms} bd` : ""}
                    {listing.bathrooms ? ` · ${listing.bathrooms} ba` : ""}
                    {listing.car_spaces ? ` · ${listing.car_spaces} car` : ""}
                    {listing.sqft ? ` · ${listing.sqft.toLocaleString()} sqft` : ""}
                  </p>
                </Link>
                <DeleteListingButton listingId={listing.id} label="Delete" />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
