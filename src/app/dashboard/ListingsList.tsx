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
type TypeFilter = "all" | "sale" | "rental";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  price_high: "Price: high to low",
  price_low: "Price: low to high",
};

const TYPE_FILTER_LABELS: Record<TypeFilter, string> = {
  all: "All types",
  sale: "For sale",
  rental: "Rentals",
};

export function ListingsList({ listings }: { listings: ListingWithCounts[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = q
      ? listings.filter((listing) => listing.address.toLowerCase().includes(q))
      : listings;

    if (typeFilter !== "all") {
      filtered = filtered.filter((listing) => listing.listing_type === typeFilter);
    }

    const sorted = [...filtered];
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
  }, [listings, query, sort, typeFilter]);

  if (listings.length === 0) {
    return (
      <div className="mt-8 rounded-md border border-line bg-paper-card px-6 py-16 text-center">
        <p className="text-sm text-ink-soft">No listings yet</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by address…"
          className="w-full rounded-md border border-line bg-paper-card px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-pine focus:outline-none sm:max-w-xs"
        />
        <div className="flex gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="rounded-md border border-line bg-paper-card px-3 py-2 text-sm text-ink focus:border-pine focus:outline-none"
          >
            {(Object.keys(TYPE_FILTER_LABELS) as TypeFilter[]).map((option) => (
              <option key={option} value={option}>
                {TYPE_FILTER_LABELS[option]}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-md border border-line bg-paper-card px-3 py-2 text-sm text-ink focus:border-pine focus:outline-none"
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
              <option key={option} value={option}>
                {SORT_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="mt-4 rounded-md border border-line bg-paper-card px-6 py-16 text-center">
          <p className="text-sm text-ink-soft">
            No listings match &quot;{query}&quot;
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {visible.map((listing) => (
            <li
              key={listing.id}
              className="flex items-center justify-between rounded-md border border-line bg-paper-card px-6 py-4 hover:border-pine"
            >
              <Link href={`/dashboard/listings/${listing.id}`} className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{listing.address}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      listing.listing_type === "rental"
                        ? "bg-pine/10 text-pine"
                        : "bg-brass/10 text-brass"
                    }`}
                  >
                    {listing.listing_type === "rental" ? "Rental" : "For sale"}
                  </span>
                  {listing.unreadCount ? (
                    <span className="rounded-full bg-brass px-2 py-0.5 text-xs font-medium text-paper">
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
          ))}
        </ul>
      )}
    </div>
  );
}
