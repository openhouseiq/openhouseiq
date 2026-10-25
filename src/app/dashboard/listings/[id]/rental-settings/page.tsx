import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { getUserCurrentAgencyId, canAccessListing } from "@/lib/agency";
import { getRentalForm } from "@/lib/rentalForms";
import type { Listing } from "@/lib/types";
import { RentalSettingsForm } from "./RentalSettingsForm";

export default async function RentalSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .returns<Listing[]>()
    .maybeSingle();
  const agencyId = await getUserCurrentAgencyId(supabase, user.id);
  if (!listing || listing.listing_type !== "rental" || !canAccessListing(listing, user.id, agencyId)) {
    notFound();
  }

  const form = getRentalForm(listing.state);
  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader
        agentLabel={fullName || user.email || ""}
        backHref={`/dashboard/listings/${listing.id}`}
        backLabel="Back to listing"
      />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-serif text-2xl font-medium text-ink">Rental application settings</h1>
        <p className="mt-1 text-sm text-ink-soft">{listing.address}</p>
        {form ? (
          <RentalSettingsForm
            listingId={listing.id}
            state={form.state}
            config={listing.rental_config ?? {}}
            leasedOn={listing.leased_on}
          />
        ) : (
          <p className="mt-8 rounded-md border border-line bg-paper-card p-4 text-sm text-ink">
            Choose a state with a built application form first.{" "}
            <Link href={`/dashboard/listings/${listing.id}/edit`} className="text-brass underline">
              Edit listing
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}
