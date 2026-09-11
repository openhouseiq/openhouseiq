import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/Button";
import { ListingsList, type ListingWithCounts } from "./ListingsList";
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

  const listingsWithCounts: ListingWithCounts[] = (listings ?? []).map((listing) => ({
    ...listing,
    feedbackCount: feedbackCounts.get(listing.id) ?? 0,
    offerCount: offerCounts.get(listing.id) ?? 0,
    unreadCount: unreadCounts.get(listing.id) ?? 0,
  }));

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

        <ListingsList listings={listingsWithCounts} />
      </main>
    </div>
  );
}
