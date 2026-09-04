import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/Button";
import { DeleteListingButton } from "./DeleteListingButton";
import type { Listing, ListingPhoto, Feedback, Offer } from "@/lib/types";

const FINANCING_LABELS: Record<string, string> = {
  cash: "Cash buyer",
  pre_approved: "Pre-approved financing",
  financing: "Financing (not yet approved)",
};

export default async function ListingDetailPage({
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

  const [{ data: photos }, { data: feedback }, { data: offers }] = await Promise.all([
    supabase
      .from("listing_photos")
      .select("*")
      .eq("listing_id", id)
      .order("position")
      .returns<ListingPhoto[]>(),
    supabase
      .from("feedback")
      .select("*")
      .eq("listing_id", id)
      .order("created_at", { ascending: false })
      .returns<Feedback[]>(),
    supabase
      .from("offers")
      .select("*")
      .eq("listing_id", id)
      .order("created_at", { ascending: false })
      .returns<Offer[]>(),
  ]);

  const unreadFeedbackIds = (feedback ?? [])
    .filter((item) => !item.read_at)
    .map((item) => item.id);
  const unreadOfferIds = (offers ?? [])
    .filter((item) => !item.read_at)
    .map((item) => item.id);

  if (unreadFeedbackIds.length > 0) {
    await supabase
      .from("feedback")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadFeedbackIds);
  }
  if (unreadOfferIds.length > 0) {
    await supabase
      .from("offers")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadOfferIds);
  }

  const photoUrls = (photos ?? []).map(
    (photo) =>
      supabase.storage.from("listing-photos").getPublicUrl(photo.storage_path).data
        .publicUrl,
  );

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const visitUrl = `${protocol}://${host}/visit/${listing.id}`;
  const qrDataUrl = await QRCode.toDataURL(visitUrl, {
    width: 220,
    margin: 1,
    color: { dark: "#1B2430", light: "#FFFFFFFF" },
  });

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader
        agentLabel={fullName || user.email || ""}
        backHref="/dashboard"
        backLabel="Back to dashboard"
      />

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-medium text-ink">
              {listing.address}
            </h1>
            <p className="mt-1 text-ink-soft">
              ${Number(listing.price).toLocaleString()}
              {listing.bedrooms ? ` · ${listing.bedrooms} bd` : ""}
              {listing.bathrooms ? ` · ${listing.bathrooms} ba` : ""}
              {listing.sqft ? ` · ${listing.sqft.toLocaleString()} sqft` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/listings/${listing.id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <DeleteListingButton listingId={listing.id} />
          </div>
        </div>

        {listing.description ? (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink">
            {listing.description}
          </p>
        ) : null}

        {photoUrls.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photoUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt={listing.address}
                className="aspect-square w-full rounded-md border border-line object-cover"
              />
            ))}
          </div>
        ) : null}

        <div className="mt-10 rounded-md border border-line bg-paper-card p-6">
          <h2 className="font-serif text-xl font-medium text-ink">
            Open house QR code
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Print this and display it at the open house. Visitors scan it to
            leave feedback or submit an offer.
          </p>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="QR code linking to this listing's visitor page"
              className="h-[220px] w-[220px] shrink-0 rounded-md border border-line"
            />
            <p className="break-all text-center text-sm text-ink-soft sm:text-left">
              {visitUrl}
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h2 className="font-serif text-xl font-medium text-ink">
              Feedback ({feedback?.length ?? 0})
            </h2>
            <div className="mt-3 space-y-3">
              {(feedback ?? []).length === 0 ? (
                <p className="text-sm text-ink-soft">No feedback yet.</p>
              ) : (
                feedback!.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-line bg-paper-card p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-ink">
                          {item.is_anonymous ? "Anonymous" : item.name || "—"}
                        </p>
                        {unreadFeedbackIds.includes(item.id) ? (
                          <span className="rounded-full bg-brass px-2 py-0.5 text-xs font-medium text-paper">
                            New
                          </span>
                        ) : null}
                      </div>
                      {item.rating ? (
                        <p className="text-sm text-brass">
                          {"★".repeat(item.rating)}
                          {"☆".repeat(5 - item.rating)}
                        </p>
                      ) : null}
                    </div>
                    {!item.is_anonymous && (item.email || item.phone) ? (
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {[item.email, item.phone].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                    {item.comments ? (
                      <p className="mt-2 text-sm text-ink">{item.comments}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="font-serif text-xl font-medium text-ink">
              Offers ({offers?.length ?? 0})
            </h2>
            <div className="mt-3 space-y-3">
              {(offers ?? []).length === 0 ? (
                <p className="text-sm text-ink-soft">No offers yet.</p>
              ) : (
                offers!.map((offer) => (
                  <div
                    key={offer.id}
                    className="rounded-md border border-line bg-paper-card p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-ink">{offer.name}</p>
                        {unreadOfferIds.includes(offer.id) ? (
                          <span className="rounded-full bg-brass px-2 py-0.5 text-xs font-medium text-paper">
                            New
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm font-medium text-pine">
                        ${Number(offer.offer_amount).toLocaleString()}
                      </p>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {[offer.email, offer.phone].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-2 text-xs text-ink-soft">
                      {[
                        FINANCING_LABELS[offer.financing_type ?? ""] ??
                          offer.financing_type,
                        offer.settlement_term
                          ? `Settlement: ${offer.settlement_term}`
                          : null,
                        offer.waive_inspection
                          ? "Waiving building & pest inspection"
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {offer.notes ? (
                      <p className="mt-2 text-sm text-ink">{offer.notes}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
