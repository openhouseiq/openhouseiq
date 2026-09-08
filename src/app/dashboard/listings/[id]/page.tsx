import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/Button";
import { DeleteListingButton } from "./DeleteListingButton";
import { FeedbackOffersReport } from "./FeedbackOffersReport";
import {
  PRICE_LABELS,
  SETTLEMENT_LABELS,
  LEVEL_LABELS,
} from "@/components/listings/sellerPreferences";
import type { Listing, ListingPhoto, Feedback, Offer } from "@/lib/types";

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
              {listing.car_spaces ? ` · ${listing.car_spaces} car` : ""}
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
            <div className="text-center sm:text-left">
              <p className="break-all text-sm text-ink-soft">{visitUrl}</p>
              <a
                href={qrDataUrl}
                download={`${listing.address.replace(/[^a-z0-9]+/gi, "-")}-qr-code.png`}
                className="mt-3 inline-block rounded-md border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
              >
                Download QR code
              </a>
            </div>
          </div>
        </div>

        {listing.seller_pref_price ||
        listing.seller_pref_settlement ||
        listing.seller_pref_waive_inspection ||
        listing.seller_pref_finance_approved ||
        listing.seller_pref_cash_buyer ? (
          <div className="mt-10 rounded-md border border-line bg-paper-card p-6">
            <h2 className="font-serif text-xl font-medium text-ink">
              Seller preferences
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              What the seller cares about — use this to judge offers below.
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
              {listing.seller_pref_price ? (
                <div>
                  <dt className="text-xs text-ink-soft">Price</dt>
                  <dd className="text-sm text-ink">
                    {PRICE_LABELS[listing.seller_pref_price]}
                  </dd>
                </div>
              ) : null}
              {listing.seller_pref_settlement ? (
                <div>
                  <dt className="text-xs text-ink-soft">Settlement period</dt>
                  <dd className="text-sm text-ink">
                    {SETTLEMENT_LABELS[listing.seller_pref_settlement]}
                  </dd>
                </div>
              ) : null}
              {listing.seller_pref_waive_inspection ? (
                <div>
                  <dt className="text-xs text-ink-soft">Waive inspection</dt>
                  <dd className="text-sm text-ink">
                    {LEVEL_LABELS[listing.seller_pref_waive_inspection]}
                  </dd>
                </div>
              ) : null}
              {listing.seller_pref_finance_approved ? (
                <div>
                  <dt className="text-xs text-ink-soft">Finance approved</dt>
                  <dd className="text-sm text-ink">
                    {LEVEL_LABELS[listing.seller_pref_finance_approved]}
                  </dd>
                </div>
              ) : null}
              {listing.seller_pref_cash_buyer ? (
                <div>
                  <dt className="text-xs text-ink-soft">Cash buyer</dt>
                  <dd className="text-sm text-ink">
                    {LEVEL_LABELS[listing.seller_pref_cash_buyer]}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}

        <FeedbackOffersReport
          feedback={feedback ?? []}
          offers={offers ?? []}
          unreadFeedbackIds={unreadFeedbackIds}
          unreadOfferIds={unreadOfferIds}
          listingAddress={listing.address}
          listing={listing}
        />
      </main>
    </div>
  );
}
