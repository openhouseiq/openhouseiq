"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DeleteListingButton } from "./listings/[id]/DeleteListingButton";
import type { Listing } from "@/lib/types";

export type ListingWithCounts = Listing & {
  feedbackCount: number;
  offerCount: number;
  applicantCount: number;
  unreadCount: number;
};

type SortOption = "newest" | "oldest" | "price_high" | "price_low";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  price_high: "Price: high to low",
  price_low: "Price: low to high",
};

function sortListings(
  listings: ListingWithCounts[],
  sort: SortOption,
): ListingWithCounts[] {
  const sorted = [...listings];
  switch (sort) {
    case "newest":
      sorted.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      break;
    case "oldest":
      sorted.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      break;
    case "price_high":
      sorted.sort((a, b) => Number(b.price) - Number(a.price));
      break;
    case "price_low":
      sorted.sort((a, b) => Number(a.price) - Number(b.price));
      break;
  }
  return sorted;
}

function ListingCard({ listing }: { listing: ListingWithCounts }) {
  return (
    <li className="flex items-center justify-between rounded-md border border-line bg-paper-card px-6 py-4 hover:border-brass">
      <Link href={`/dashboard/listings/${listing.id}`} className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-ink">{listing.address}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              listing.listing_type === "rental"
                ? "bg-brass/10 text-brass"
                : "bg-brass/10 text-brass"
            }`}
          >
            {listing.listing_type === "rental" ? "Rental" : "For sale"}
          </span>
          {listing.unreadCount ? (
            <span className="rounded-full bg-brass px-2 py-0.5 text-xs font-medium text-ink">
              {listing.unreadCount} new
            </span>
          ) : null}
        </div>
        <p className="text-sm text-ink-soft">
          ${Number(listing.price).toLocaleString()}
          {listing.listing_type === "rental" ? "/week" : ""}
          {listing.bedrooms ? ` · ${listing.bedrooms} bd` : ""}
          {listing.bathrooms ? ` · ${listing.bathrooms} ba` : ""}
          {listing.car_spaces ? ` · ${listing.car_spaces} car` : ""}
          {listing.sqft ? ` · ${listing.sqft.toLocaleString()} sqft` : ""}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="rounded-full border border-line px-2 py-0.5 text-xs text-ink-soft">
            {listing.feedbackCount} feedback
          </span>
          <span className="rounded-full border border-line px-2 py-0.5 text-xs text-ink-soft">
            {listing.listing_type === "rental"
              ? `${listing.applicantCount} applicants`
              : `${listing.offerCount} offers`}
          </span>
        </div>
      </Link>
      <DeleteListingButton listingId={listing.id} label="Delete" />
    </li>
  );
}

function ListingColumn({
  listings,
  emptyLabel,
}: {
  listings: ListingWithCounts[];
  emptyLabel: React.ReactNode;
}) {
  if (listings.length === 0) {
    return (
      <div className="rounded-md border border-line bg-paper-card px-6 py-16 text-center">
        <p className="text-sm text-ink-soft">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </ul>
  );
}

export function ListingsList({ listings }: { listings: ListingWithCounts[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [showSale, setShowSale] = useState(true);
  const [showRental, setShowRental] = useState(true);

  const matched = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? listings.filter((listing) => listing.address.toLowerCase().includes(q))
      : listings;
  }, [listings, query]);

  const saleListings = useMemo(
    () => sortListings(matched.filter((l) => l.listing_type === "sale"), sort),
    [matched, sort],
  );
  const rentalListings = useMemo(
    () => sortListings(matched.filter((l) => l.listing_type === "rental"), sort),
    [matched, sort],
  );

  if (listings.length === 0) {
    return (
      <div className="mt-8 rounded-md border border-line bg-paper-card px-6 py-16 text-center">
        <p className="text-sm text-ink-soft">No listings yet</p>
      </div>
    );
  }

  const noResultsLabel = query ? (
    <>No listings match &quot;{query}&quot;</>
  ) : (
    "No listings"
  );

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by address…"
          className="w-full rounded-md border border-line bg-paper-card px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-brass focus:outline-none sm:max-w-xs"
        />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-soft">Show:</span>
            <button
              type="button"
              onClick={() => setShowSale((v) => !v)}
              aria-pressed={showSale}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                showSale
                  ? "border-brass bg-brass text-ink"
                  : "border-line bg-white text-ink-soft hover:border-brass hover:text-ink"
              }`}
            >
              {showSale ? "✓ For sale" : "For sale"}
            </button>
            <button
              type="button"
              onClick={() => setShowRental((v) => !v)}
              aria-pressed={showRental}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                showRental
                  ? "border-brass bg-brass text-ink"
                  : "border-line bg-white text-ink-soft hover:border-brass hover:text-ink"
              }`}
            >
              {showRental ? "✓ Rental" : "Rental"}
            </button>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-md border border-line bg-paper-card px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none"
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
              <option key={option} value={option}>
                {SORT_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!showSale && !showRental ? (
        <div className="mt-4 rounded-md border border-line bg-paper-card px-6 py-16 text-center">
          <p className="text-sm text-ink-soft">
            Select &quot;For sale&quot; or &quot;Rental&quot; above to see your listings.
          </p>
        </div>
      ) : showSale && showRental ? (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h2 className="mb-3 font-serif text-lg font-medium text-ink">For sale</h2>
            <ListingColumn
              listings={saleListings}
              emptyLabel={query ? noResultsLabel : "No listings for sale"}
            />
          </div>
          <div>
            <h2 className="mb-3 font-serif text-lg font-medium text-ink">Rental</h2>
            <ListingColumn
              listings={rentalListings}
              emptyLabel={query ? noResultsLabel : "No rental listings"}
            />
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <ListingColumn
            listings={showSale ? saleListings : rentalListings}
            emptyLabel={
              query
                ? noResultsLabel
                : showSale
                  ? "No listings for sale"
                  : "No rental listings"
            }
          />
        </div>
      )}
    </div>
  );
}
