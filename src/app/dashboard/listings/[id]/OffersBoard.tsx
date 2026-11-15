"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ContactLine } from "@/components/ui/ContactLine";
import { SETTLEMENT_LABELS } from "@/components/listings/sellerPreferences";
import { createClient } from "@/lib/supabase/client";
import {
  offerConditions,
  sellerPriorities,
  type OfferScore,
  type ScoringListing,
} from "@/lib/offerScoring";
import type { Offer } from "@/lib/types";

type PrefListing = Omit<ScoringListing, "price">;

const FINANCING_SHORT: Record<string, string> = {
  cash: "Cash buyer",
  pre_approved: "Pre-approved",
  financing: "Finance not yet approved",
};

function ConditionsLine({ offer }: { offer: Offer }) {
  const conditions = offerConditions(offer);
  return (
    <p className={conditions.length === 0 ? "font-medium text-ink" : ""}>
      {conditions.length === 0 ? "No conditions" : `Subject to ${conditions.join(", ").toLowerCase()}`}
    </p>
  );
}

function MatchBar({ score }: { score: OfferScore }) {
  if (score.matchPercent === null) {
    return <span className="text-sm text-ink-soft">—</span>;
  }
  const pct = score.matchPercent;
  const fill = pct >= 75 ? "bg-navy" : pct >= 40 ? "bg-brass" : "bg-ink-soft/40";
  return (
    <div>
      <div className="flex items-center gap-3">
        <div
          className="h-2 w-full max-w-28 overflow-hidden rounded-full bg-line"
          role="meter"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Match to seller's preferences"
        >
          <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="font-display text-lg font-semibold! text-ink tabular-nums">
          {pct}%
        </span>
      </div>
      {score.unmetRequired.length > 0 ? (
        <p className="mt-1 text-xs font-medium text-error">
          Missing: {score.unmetRequired.join(", ")}
        </p>
      ) : null}
    </div>
  );
}

const COLS =
  "md:grid md:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,1.6fr)_minmax(0,1.5fr)] md:items-center md:gap-4";

function LiveSwitch({ listingId, initialOpen }: { listingId: string; initialOpen: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function toggle() {
    const next = !open;
    if (
      !next &&
      !window.confirm(
        "Close offers for this property? Buyers who scan the QR code won't be able to send an offer until you reopen.",
      )
    ) {
      return;
    }
    setSaving(true);
    setError(false);
    const { error } = await createClient()
      .from("listings")
      .update({ offers_open: next })
      .eq("id", listingId);
    setSaving(false);
    if (error) setError(true);
    else setOpen(next);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
          open ? "bg-emerald-50 text-emerald-800" : "bg-line text-ink-soft"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${open ? "bg-emerald-600" : "bg-ink-soft/50"}`}
          aria-hidden="true"
        />
        {open ? "Live · taking offers" : "Offers closed"}
      </span>
      <button
        type="button"
        onClick={toggle}
        disabled={saving}
        className="text-xs text-ink-soft underline hover:text-ink disabled:opacity-60"
      >
        {saving ? "Saving…" : open ? "Close offers" : "Reopen offers"}
      </button>
      {error ? <span className="text-xs text-error">Couldn&apos;t save. Try again.</span> : null}
    </div>
  );
}

export function OffersBoard({
  listingId,
  offersOpen,
  rankedOffers,
  unreadOfferIds,
  listingAddress,
  listing,
  hasSellerPreferences,
  deletingId,
  onDelete,
  onExport,
}: {
  rankedOffers: { offer: Offer; score: OfferScore }[];
  unreadOfferIds: string[];
  listingAddress: string;
  listing: PrefListing;
  hasSellerPreferences: boolean;
  deletingId: string | null;
  onDelete: (id: string) => void;
  onExport: () => void;
  listingId?: string;
  /** Undefined until database update 0041 adds the switch. */
  offersOpen?: boolean;
}) {
  const priorities = sellerPriorities(listing);
  const count = rankedOffers.length;
  const ranked = hasSellerPreferences && count > 0;

  return (
    <section className="mt-10 overflow-hidden rounded-xl border border-line bg-paper-card">
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
        <div className="min-w-0">
          <h2 className="font-display text-2xl font-semibold! tracking-tight text-ink sm:text-3xl">
            Offers <span className="text-brass">·</span> {listingAddress}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {count === 0
              ? "No offers yet."
              : `${count} ${count === 1 ? "offer" : "offers"} received`}
          </p>
        </div>
        <div className="flex items-start gap-4">
          {listingId && offersOpen !== undefined ? (
            <LiveSwitch listingId={listingId} initialOpen={offersOpen} />
          ) : null}
          <Button variant="secondary" onClick={onExport} disabled={count === 0}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="border-y border-line bg-paper px-6 py-3">
        {priorities.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium uppercase tracking-wider text-ink-soft">
              Seller priorities
            </span>
            {priorities.map((pr, i) => (
              <span
                key={pr.key}
                className="rounded-full border border-line bg-paper-card px-3 py-1 text-sm text-ink"
              >
                {i + 1}. {pr.label}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-soft">
            Add the seller&apos;s preferences in Edit listing to rank offers by how well they
            match.
          </p>
        )}
        {ranked && count > 1 ? (
          <p className="mt-2 text-xs text-ink-soft">
            Numbered by how much each counts. Offers sorted by match. You still make the call.
          </p>
        ) : null}
      </div>

      {count > 0 ? (
        <div
          className={`hidden px-6 py-3 text-xs font-medium uppercase tracking-wider text-ink-soft ${COLS}`}
        >
          <span>Buyer</span>
          <span>Offer</span>
          <span>Settlement</span>
          <span>Finance &amp; conditions</span>
          <span>Match</span>
        </div>
      ) : null}

      <ol>
        {rankedOffers.map(({ offer, score }, i) => {
          const top = ranked && i === 0 && score.unmetRequired.length === 0;
          return (
            <li
              key={offer.id}
              className={`border-t border-line px-6 py-5 ${top ? "bg-brass/5" : ""}`}
            >
              <div className={`space-y-3 md:space-y-0 ${COLS}`}>
                <div className="flex min-w-0 items-start gap-3">
                  {ranked ? (
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        top ? "bg-brass text-paper" : "bg-line text-ink"
                      }`}
                      aria-label={`Rank ${i + 1}`}
                    >
                      {i + 1}
                    </span>
                  ) : null}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-medium text-ink">{offer.name}</p>
                      {unreadOfferIds.includes(offer.id) ? (
                        <span className="rounded-full bg-navy px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-paper">
                          New
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <p className="font-display text-xl font-semibold! text-ink tabular-nums">
                  ${Number(offer.offer_amount).toLocaleString()}
                </p>

                <p className="text-sm text-ink">
                  <span className="text-ink-soft md:hidden">Settlement: </span>
                  {offer.settlement_term
                    ? SETTLEMENT_LABELS[offer.settlement_term] ?? offer.settlement_term
                    : "—"}
                </p>

                <div className="text-sm text-ink-soft">
                  <p>
                    {[
                      offer.financing_type
                        ? FINANCING_SHORT[offer.financing_type] ?? offer.financing_type
                        : null,
                      offer.deposit_percent ? `${Number(offer.deposit_percent)}% deposit` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  <ConditionsLine offer={offer} />
                </div>

                {hasSellerPreferences ? (
                  <MatchBar score={score} />
                ) : (
                  <span className="text-sm text-ink-soft">—</span>
                )}
              </div>

              <div
                className={`mt-2 flex flex-wrap items-start justify-between gap-x-4 gap-y-1 ${ranked ? "md:pl-10" : ""}`}
              >
                <div className="min-w-0 space-y-1">
                  <ContactLine
                    email={offer.email}
                    phone={offer.phone}
                    className="text-xs text-ink-soft"
                  />
                  {offer.notes ? (
                    <p className="max-w-2xl text-sm text-ink">&ldquo;{offer.notes}&rdquo;</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(offer.id)}
                  disabled={deletingId === offer.id}
                  className="text-xs text-error underline disabled:opacity-60"
                >
                  {deletingId === offer.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
