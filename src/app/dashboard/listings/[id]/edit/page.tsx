import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EditListingForm } from "./EditListingForm";
import { ManagePhotos } from "./ManagePhotos";
import type { Listing, ListingPhoto } from "@/lib/types";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .returns<Listing[]>()
    .maybeSingle();

  if (!listing || listing.agent_id !== user.id) {
    notFound();
  }

  const { data: photos } = await supabase
    .from("listing_photos")
    .select("*")
    .eq("listing_id", id)
    .order("position")
    .returns<ListingPhoto[]>();

  const photosWithUrls = (photos ?? []).map((photo) => ({
    ...photo,
    url: supabase.storage.from("listing-photos").getPublicUrl(photo.storage_path).data
      .publicUrl,
  }));

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader
        agentLabel={fullName || user.email || ""}
        backHref={`/dashboard/listings/${listing.id}`}
        backLabel="Back to listing"
      />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-serif text-2xl font-medium text-ink">Edit listing</h1>

        {photosWithUrls.length > 0 ? (
          <div className="mt-8">
            <h2 className="mb-2 text-sm font-medium text-ink">Photos</h2>
            <ManagePhotos photos={photosWithUrls} />
          </div>
        ) : null}

        <EditListingForm listing={listing} />
      </main>
    </div>
  );
}
