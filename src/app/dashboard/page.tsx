import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/Button";
import { DeleteListingButton } from "./listings/[id]/DeleteListingButton";
import type { Listing } from "@/lib/types";

function accountAgeDays(createdAt: string): number {
  return (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscription?.status === "incomplete") {
    redirect("/dashboard/welcome");
  }

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";
  const firstName = fullName.split(" ")[0] || user.email || "there";

  let showFeedbackPrompt = false;
  if (accountAgeDays(user.created_at) >= 30) {
    const { data: existingFeedback } = await supabase
      .from("product_feedback")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    showFeedbackPrompt = !existingFeedback;
  }

  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Listing[]>();

  const listingIds = (listings ?? []).map((listing) => listing.id);
  const unreadCounts = new Map<string, number>();
  const feedbackCounts = new Map<string, number>();
  const offerCounts = new Map<string, number>();

  if (listingIds.length > 0) {
    const [{ data: unreadFeedback }, { data: unreadOffers }, { data: allFeedback }, { data: allOffers }] =
      await Promise.all([
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
        supabase.from("feedback").select("listing_id").in("listing_id", listingIds),
        supabase.from("offers").select("listing_id").in("listing_id", listingIds),
      ]);

    for (const row of [...(unreadFeedback ?? []), ...(unreadOffers ?? [])]) {
      unreadCounts.set(row.listing_id, (unreadCounts.get(row.listing_id) ?? 0) + 1);
    }
    for (const row of allFeedback ?? []) {
      feedbackCounts.set(row.listing_id, (feedbackCounts.get(row.listing_id) ?? 0) + 1);
    }
    for (const row of allOffers ?? []) {
      offerCounts.set(row.listing_id, (offerCounts.get(row.listing_id) ?? 0) + 1);
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

        {showFeedbackPrompt ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-brass bg-brass/10 px-6 py-4">
            <p className="text-sm text-ink">
              You&apos;ve been using OpenHouseIQ for a month — we&apos;d love
              your feedback.
            </p>
            <Link href="/dashboard/product-feedback">
              <Button variant="secondary">Give feedback</Button>
            </Link>
          </div>
        ) : null}

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
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="rounded-full border border-line px-2 py-0.5 text-xs text-ink-soft">
                      {feedbackCounts.get(listing.id) ?? 0} feedback
                    </span>
                    <span className="rounded-full border border-line px-2 py-0.5 text-xs text-ink-soft">
                      {offerCounts.get(listing.id) ?? 0} offers
                    </span>
                  </div>
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
