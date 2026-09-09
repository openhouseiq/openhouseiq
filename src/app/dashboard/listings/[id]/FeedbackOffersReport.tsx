"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { scoreOffer, type OfferScore } from "@/lib/offerScoring";
import { SETTLEMENT_LABELS } from "@/components/listings/sellerPreferences";
import type { Feedback, Offer, Listing } from "@/lib/types";

type ScoringListing = Pick<
  Listing,
  | "price"
  | "seller_pref_price"
  | "seller_pref_settlement"
  | "seller_pref_waive_inspection"
  | "seller_pref_finance_approved"
  | "seller_pref_cash_buyer"
>;

const FINANCING_LABELS: Record<string, string> = {
  cash: "Cash buyer",
  pre_approved: "Pre-approved financing",
  financing: "Financing (not yet approved)",
};

const INTEREST_LEVEL_LABELS: Record<string, string> = {
  not_interested: "Not interested",
  considering: "Considering",
  very_interested: "Very interested",
  ready_to_offer: "Ready to make an offer",
};

const INTEREST_LEVEL_STYLES: Record<string, string> = {
  not_interested: "bg-line text-ink-soft",
  considering: "bg-line text-ink-soft",
  very_interested: "bg-brass text-paper",
  ready_to_offer: "bg-pine text-paper",
};

const TIMEFRAME_LABELS: Record<string, string> = {
  immediately: "Immediately",
  one_to_three_months: "1–3 months",
  three_to_six_months: "3–6 months",
  six_plus_months: "6+ months",
  just_browsing: "Just browsing",
};

function CategoryStars({ label, value }: { label: string; value: number | null }) {
  if (!value) return null;
  return (
    <p className="text-xs text-ink-soft">
      {label}: <span className="text-brass">{"★".repeat(value)}{"☆".repeat(5 - value)}</span>
    </p>
  );
}

function inRange(createdAt: string, from: string, to: string): boolean {
  const day = createdAt.slice(0, 10);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

function MatchBadge({ score }: { score: OfferScore }) {
  if (score.unmetRequired.length > 0) {
    return (
      <span className="rounded-full bg-error/10 px-2 py-0.5 text-xs font-medium text-error">
        Missing: {score.unmetRequired.join(", ")}
      </span>
    );
  }
  if (score.matchPercent === null) return null;
  const style =
    score.matchPercent >= 75
      ? "bg-pine text-paper"
      : score.matchPercent >= 40
        ? "bg-brass text-paper"
        : "bg-line text-ink-soft";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style}`}>
      {score.matchPercent}% match
    </span>
  );
}

function csvCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function FeedbackOffersReport({
  feedback,
  offers,
  unreadFeedbackIds,
  unreadOfferIds,
  listingAddress,
  listing,
}: {
  feedback: Feedback[];
  offers: Offer[];
  unreadFeedbackIds: string[];
  unreadOfferIds: string[];
  listingAddress: string;
  listing: ScoringListing;
}) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [feedbackList, setFeedbackList] = useState(feedback);
  const [offersList, setOffersList] = useState(offers);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deleteFeedback(id: string) {
    if (!window.confirm("Delete this feedback entry? This can't be undone.")) return;
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("feedback").delete().eq("id", id);
    setDeletingId(null);
    if (!error) {
      setFeedbackList((prev) => prev.filter((item) => item.id !== id));
    }
  }

  async function deleteOffer(id: string) {
    if (!window.confirm("Delete this offer? This can't be undone.")) return;
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase.from("offers").delete().eq("id", id);
    setDeletingId(null);
    if (!error) {
      setOffersList((prev) => prev.filter((item) => item.id !== id));
    }
  }

  const hasSellerPreferences = Boolean(
    listing.seller_pref_price ||
      listing.seller_pref_settlement ||
      listing.seller_pref_waive_inspection ||
      listing.seller_pref_finance_approved ||
      listing.seller_pref_cash_buyer,
  );

  const filteredFeedback = useMemo(
    () => feedbackList.filter((item) => inRange(item.created_at, fromDate, toDate)),
    [feedbackList, fromDate, toDate],
  );
  const filteredOffers = useMemo(
    () => offersList.filter((item) => inRange(item.created_at, fromDate, toDate)),
    [offersList, fromDate, toDate],
  );

  const rankedOffers = useMemo(() => {
    const withScores = filteredOffers.map((offer) => ({
      offer,
      score: scoreOffer(offer, listing),
    }));

    if (!hasSellerPreferences) {
      return withScores;
    }

    return withScores.sort((a, b) => {
      const aUnmet = a.score.unmetRequired.length > 0;
      const bUnmet = b.score.unmetRequired.length > 0;
      if (aUnmet !== bUnmet) return aUnmet ? 1 : -1;

      const aPct = a.score.matchPercent ?? -1;
      const bPct = b.score.matchPercent ?? -1;
      if (aPct !== bPct) return bPct - aPct;

      return Number(b.offer.offer_amount) - Number(a.offer.offer_amount);
    });
  }, [filteredOffers, listing, hasSellerPreferences]);

  function exportFeedback() {
    const header = [
      "Date",
      "Name",
      "Email",
      "Phone",
      "Anonymous",
      "Interest level",
      "Price",
      "Condition",
      "Location",
      "Layout",
      "Pre-approved",
      "Working with agent",
      "Purchase timeframe",
      "Wants follow-up",
      "Comments",
    ];
    const rows = filteredFeedback.map((f) => [
      new Date(f.created_at).toLocaleString(),
      f.is_anonymous ? "" : f.name ?? "",
      f.is_anonymous ? "" : f.email ?? "",
      f.is_anonymous ? "" : f.phone ?? "",
      f.is_anonymous ? "Yes" : "No",
      f.interest_level ? INTEREST_LEVEL_LABELS[f.interest_level] ?? f.interest_level : "",
      f.rating_price ?? "",
      f.rating_condition ?? "",
      f.rating_location ?? "",
      f.rating_layout ?? "",
      f.pre_approved ? "Yes" : "No",
      f.working_with_agent ? "Yes" : "No",
      f.purchase_timeframe
        ? TIMEFRAME_LABELS[f.purchase_timeframe] ?? f.purchase_timeframe
        : "",
      f.wants_followup ? "Yes" : "No",
      f.comments ?? "",
    ]);
    downloadCsv(
      `${listingAddress} - feedback${rangeSuffix()}.csv`,
      [header, ...rows],
    );
  }

  function exportOffers() {
    const header = [
      "Date",
      "Name",
      "Email",
      "Phone",
      "Offer amount",
      "Financing",
      "Settlement term",
      "Waive inspection",
      "Match %",
      "Missing seller requirements",
      "Notes",
    ];
    const rows = rankedOffers.map(({ offer: o, score }) => [
      new Date(o.created_at).toLocaleString(),
      o.name,
      o.email,
      o.phone ?? "",
      o.offer_amount,
      o.financing_type
        ? FINANCING_LABELS[o.financing_type] ?? o.financing_type
        : "",
      o.settlement_term
        ? SETTLEMENT_LABELS[o.settlement_term] ?? o.settlement_term
        : "",
      o.waive_inspection ? "Yes" : "No",
      score.matchPercent ?? "",
      score.unmetRequired.join(", "),
      o.notes ?? "",
    ]);
    downloadCsv(`${listingAddress} - offers${rangeSuffix()}.csv`, [header, ...rows]);
  }

  function rangeSuffix() {
    if (!fromDate && !toDate) return "";
    return ` (${fromDate || "start"} to ${toDate || "now"})`;
  }

  return (
    <>
      <div className="mt-10 flex flex-wrap items-end gap-3 rounded-md border border-line bg-paper-card p-4">
        <div>
          <label htmlFor="from-date" className="mb-1 block text-xs font-medium text-ink-soft">
            From
          </label>
          <input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-md border border-line px-2 py-1.5 text-sm text-ink focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine"
          />
        </div>
        <div>
          <label htmlFor="to-date" className="mb-1 block text-xs font-medium text-ink-soft">
            To
          </label>
          <input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-md border border-line px-2 py-1.5 text-sm text-ink focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine"
          />
        </div>
        {fromDate || toDate ? (
          <button
            type="button"
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            className="text-sm text-pine underline"
          >
            Clear dates
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-serif text-xl font-medium text-ink">
              Feedback ({filteredFeedback.length})
            </h2>
            <Button
              variant="secondary"
              onClick={exportFeedback}
              disabled={filteredFeedback.length === 0}
            >
              Export CSV
            </Button>
          </div>
          <div className="mt-3 space-y-3">
            {filteredFeedback.length === 0 ? (
              <p className="text-sm text-ink-soft">No feedback in this range.</p>
            ) : (
              filteredFeedback.map((item) => (
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
                    {item.interest_level ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          INTEREST_LEVEL_STYLES[item.interest_level] ??
                          "bg-line text-ink-soft"
                        }`}
                      >
                        {INTEREST_LEVEL_LABELS[item.interest_level] ??
                          item.interest_level}
                      </span>
                    ) : null}
                  </div>
                  {!item.is_anonymous && (item.email || item.phone) ? (
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {[item.email, item.phone].filter(Boolean).join(" · ")}
                      {item.wants_followup ? " · Wants follow-up" : ""}
                    </p>
                  ) : null}

                  {item.rating_price ||
                  item.rating_condition ||
                  item.rating_location ||
                  item.rating_layout ? (
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5">
                      <CategoryStars label="Price" value={item.rating_price} />
                      <CategoryStars
                        label="Condition"
                        value={item.rating_condition}
                      />
                      <CategoryStars label="Location" value={item.rating_location} />
                      <CategoryStars label="Layout" value={item.rating_layout} />
                    </div>
                  ) : null}

                  {item.pre_approved ||
                  item.working_with_agent ||
                  item.purchase_timeframe ? (
                    <p className="mt-2 text-xs text-ink-soft">
                      {[
                        item.pre_approved ? "Pre-approved" : null,
                        item.working_with_agent ? "Has an agent" : null,
                        item.purchase_timeframe
                          ? TIMEFRAME_LABELS[item.purchase_timeframe]
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : null}

                  {item.comments ? (
                    <p className="mt-2 text-sm text-ink">{item.comments}</p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => deleteFeedback(item.id)}
                    disabled={deletingId === item.id}
                    className="mt-2 text-xs text-error underline disabled:opacity-60"
                  >
                    {deletingId === item.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-serif text-xl font-medium text-ink">
              Offers ({rankedOffers.length})
            </h2>
            <Button
              variant="secondary"
              onClick={exportOffers}
              disabled={rankedOffers.length === 0}
            >
              Export CSV
            </Button>
          </div>
          {hasSellerPreferences && rankedOffers.length > 1 ? (
            <p className="mt-1 text-xs text-ink-soft">
              Ranked by match to the seller&apos;s preferences.
            </p>
          ) : null}
          <div className="mt-3 space-y-3">
            {rankedOffers.length === 0 ? (
              <p className="text-sm text-ink-soft">No offers in this range.</p>
            ) : (
              rankedOffers.map(({ offer, score }) => (
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
                  {hasSellerPreferences ? (
                    <div className="mt-2">
                      <MatchBadge score={score} />
                    </div>
                  ) : null}
                  <p className="mt-2 text-xs text-ink-soft">
                    {[
                      FINANCING_LABELS[offer.financing_type ?? ""] ??
                        offer.financing_type,
                      offer.settlement_term
                        ? `Settlement: ${SETTLEMENT_LABELS[offer.settlement_term] ?? offer.settlement_term}`
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

                  <button
                    type="button"
                    onClick={() => deleteOffer(offer.id)}
                    disabled={deletingId === offer.id}
                    className="mt-2 text-xs text-error underline disabled:opacity-60"
                  >
                    {deletingId === offer.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
