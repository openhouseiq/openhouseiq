import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getAgentPhotoUrl } from "@/lib/agent-photo";
import { scoreOffer } from "@/lib/offerScoring";
import { scoreApplicant } from "@/lib/rentalScoring";
import { SETTLEMENT_LABELS } from "@/components/listings/sellerPreferences";
import { LEASE_TERM_LABELS, INCOME_RANGE_LABELS } from "@/components/listings/landlordPreferences";
import { PrintButton } from "./PrintButton";
import type { Listing, Feedback, Offer, Applicant } from "@/lib/types";

const INTEREST_LEVEL_LABELS: Record<string, string> = {
  not_interested: "Not interested",
  considering: "Considering",
  very_interested: "Very interested",
  ready_to_offer: "Ready to make an offer",
};

const FINANCING_LABELS: Record<string, string> = {
  cash: "Cash buyer",
  pre_approved: "Pre-approved financing",
  financing: "Financing (not yet approved)",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function Stars({ label, value }: { label: string; value: number | null }) {
  if (!value) return null;
  return (
    <span className="mr-3 inline-block">
      {label}: <span className="text-brass">{"★".repeat(value)}{"☆".repeat(5 - value)}</span>
    </span>
  );
}

function MatchBadge({
  matchPercent,
  unmetRequired,
}: {
  matchPercent: number | null;
  unmetRequired: string[];
}) {
  if (unmetRequired.length > 0) {
    return (
      <span className="rounded-full bg-[#F3D8D3] px-2 py-0.5 text-xs font-semibold text-[#7A3B2E]">
        Missing: {unmetRequired.join(", ")}
      </span>
    );
  }
  if (matchPercent === null) return null;
  return (
    <span className="rounded-full bg-brass px-2 py-0.5 text-xs font-semibold text-ink">
      {matchPercent}% match
    </span>
  );
}

export default async function ListingReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

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

  const isRental = listing.listing_type === "rental";

  const [{ data: feedback }, { data: offers }, { data: applicants }] = await Promise.all([
    supabase
      .from("feedback")
      .select("*")
      .eq("listing_id", id)
      .order("created_at", { ascending: false })
      .returns<Feedback[]>(),
    isRental
      ? Promise.resolve({ data: [] as Offer[] })
      : supabase
          .from("offers")
          .select("*")
          .eq("listing_id", id)
          .order("created_at", { ascending: false })
          .returns<Offer[]>(),
    isRental
      ? supabase
          .from("applicants")
          .select("*")
          .eq("listing_id", id)
          .order("created_at", { ascending: false })
          .returns<Applicant[]>()
      : Promise.resolve({ data: [] as Applicant[] }),
  ]);

  const feedbackList = feedback ?? [];

  const hasSellerPreferences = Boolean(
    listing.seller_pref_price ||
      listing.seller_pref_settlement ||
      listing.seller_pref_waive_inspection ||
      listing.seller_pref_finance_approved ||
      listing.seller_pref_cash_buyer,
  );
  const hasLandlordPreferences = Boolean(
    listing.landlord_pref_pets ||
      listing.landlord_pref_min_lease_term ||
      listing.landlord_pref_smoking ||
      listing.landlord_pref_employment_verification,
  );

  const rankedOffers = (offers ?? [])
    .map((offer) => ({ offer, score: scoreOffer(offer, listing) }))
    .sort((a, b) => {
      if (!hasSellerPreferences) return 0;
      const aUnmet = a.score.unmetRequired.length > 0;
      const bUnmet = b.score.unmetRequired.length > 0;
      if (aUnmet !== bUnmet) return aUnmet ? 1 : -1;
      const aPct = a.score.matchPercent ?? -1;
      const bPct = b.score.matchPercent ?? -1;
      if (aPct !== bPct) return bPct - aPct;
      return Number(b.offer.offer_amount) - Number(a.offer.offer_amount);
    });

  const rankedApplicants = (applicants ?? [])
    .map((applicant) => ({ applicant, score: scoreApplicant(applicant, listing) }))
    .sort((a, b) => {
      if (!hasLandlordPreferences) return 0;
      const aUnmet = a.score.unmetRequired.length > 0;
      const bUnmet = b.score.unmetRequired.length > 0;
      if (aUnmet !== bUnmet) return aUnmet ? 1 : -1;
      return (b.score.matchPercent ?? -1) - (a.score.matchPercent ?? -1);
    });

  const agentPhotoUrl = await getAgentPhotoUrl(listing.agent_id);
  const agentName =
    listing.agent_name || (user.user_metadata?.full_name as string | undefined) || "";
  const agentPhone = (user.user_metadata?.phone as string | undefined) || "";
  const generatedDate = new Date().toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#EDE9E0] print:bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4 print:hidden">
        <Link
          href={`/dashboard/listings/${listing.id}`}
          className="text-sm text-ink-soft underline hover:text-brass"
        >
          ← Back to listing
        </Link>
        <PrintButton />
      </div>

      <div className="mx-auto max-w-4xl bg-white px-10 py-10 shadow-sm print:max-w-none print:px-0 print:py-0 print:shadow-none">
        <div className="flex flex-col gap-6 border-b-2 border-ink pb-6 sm:flex-row sm:items-start sm:justify-between print:flex-row">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-brass">
              Property report
            </p>
            <h1 className="mt-1 font-serif text-2xl font-semibold leading-tight text-ink">
              {listing.address}
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              ${Number(listing.price).toLocaleString()}
              {isRental ? "/week" : ""}
              {listing.bedrooms ? ` · ${listing.bedrooms} bd` : ""}
              {listing.bathrooms ? ` · ${listing.bathrooms} ba` : ""}
              {listing.car_spaces ? ` · ${listing.car_spaces} car` : ""}
              {listing.sqft ? ` · ${listing.sqft.toLocaleString()} sqft` : ""}
            </p>
            <p className="mt-2 text-xs text-ink-soft">Generated {generatedDate}</p>
          </div>

          <div className="flex shrink-0 items-start gap-3 text-left sm:text-right">
            <div>
              <p className="text-sm font-semibold text-ink">{agentName || "—"}</p>
              {listing.agent_email ? (
                <p className="mt-0.5 text-xs text-ink-soft">{listing.agent_email}</p>
              ) : null}
              {agentPhone ? (
                <p className="mt-0.5 text-xs text-ink-soft">{agentPhone}</p>
              ) : null}
            </div>
            {agentPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agentPhotoUrl}
                alt={agentName}
                className="h-11 w-11 shrink-0 rounded-full border border-line object-cover"
              />
            ) : agentName ? (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-paper">
                {initials(agentName)}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <h2 className="font-serif text-lg font-semibold text-ink">
              Feedback ({feedbackList.length})
            </h2>
            <div className="mt-3 space-y-3">
              {feedbackList.length === 0 ? (
                <p className="text-sm text-ink-soft">No feedback yet.</p>
              ) : (
                feedbackList.map((item) => (
                  <div key={item.id} className="break-inside-avoid rounded-md border border-line p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">
                        {item.is_anonymous ? "Anonymous" : item.name || "—"}
                      </p>
                      {item.interest_level ? (
                        <span className="rounded-full bg-brass px-2 py-0.5 text-xs font-semibold text-ink">
                          {INTEREST_LEVEL_LABELS[item.interest_level] ?? item.interest_level}
                        </span>
                      ) : null}
                    </div>
                    {(item.rating_price ||
                      item.rating_condition ||
                      item.rating_location ||
                      item.rating_layout) && (
                      <p className="mt-1.5 text-xs text-ink-soft">
                        <Stars label="Price" value={item.rating_price} />
                        <Stars label="Condition" value={item.rating_condition} />
                        <Stars label="Location" value={item.rating_location} />
                        <Stars label="Layout" value={item.rating_layout} />
                      </p>
                    )}
                    {item.comments ? (
                      <p className="mt-2 text-sm leading-relaxed text-ink">{item.comments}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="font-serif text-lg font-semibold text-ink">
              {isRental ? `Applicants (${rankedApplicants.length})` : `Offers (${rankedOffers.length})`}
            </h2>
            {isRental ? (
              <div className="mt-3 space-y-3">
                {rankedApplicants.length === 0 ? (
                  <p className="text-sm text-ink-soft">No applicants yet.</p>
                ) : (
                  rankedApplicants.map(({ applicant, score }) => (
                    <div key={applicant.id} className="break-inside-avoid rounded-md border border-line p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">{applicant.name}</p>
                        {hasLandlordPreferences ? (
                          <MatchBadge
                            matchPercent={score.matchPercent}
                            unmetRequired={score.unmetRequired}
                          />
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-xs text-ink-soft">
                        {[
                          applicant.occupation,
                          applicant.income_range
                            ? INCOME_RANGE_LABELS[applicant.income_range]
                            : null,
                          applicant.desired_lease_term
                            ? LEASE_TERM_LABELS[applicant.desired_lease_term]
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {applicant.notes ? (
                        <p className="mt-2 text-sm leading-relaxed text-ink">{applicant.notes}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {rankedOffers.length === 0 ? (
                  <p className="text-sm text-ink-soft">No offers yet.</p>
                ) : (
                  rankedOffers.map(({ offer, score }) => (
                    <div key={offer.id} className="break-inside-avoid rounded-md border border-line p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">{offer.name}</p>
                        <p className="text-sm font-semibold text-brass">
                          ${Number(offer.offer_amount).toLocaleString()}
                        </p>
                      </div>
                      {hasSellerPreferences ? (
                        <div className="mt-1.5">
                          <MatchBadge
                            matchPercent={score.matchPercent}
                            unmetRequired={score.unmetRequired}
                          />
                        </div>
                      ) : null}
                      <p className="mt-1.5 text-xs text-ink-soft">
                        {[
                          offer.financing_type ? FINANCING_LABELS[offer.financing_type] : null,
                          offer.settlement_term
                            ? `Settlement: ${SETTLEMENT_LABELS[offer.settlement_term]}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {offer.notes ? (
                        <p className="mt-2 text-sm leading-relaxed text-ink">{offer.notes}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-end gap-1.5 border-t border-line pt-5">
          <span className="text-xs text-ink-soft">Powered by</span>
          <span className="font-serif text-sm font-semibold">
            <span className="text-brass">Cue</span>
            <span className="text-ink">Property</span>
          </span>
        </div>
      </div>
    </div>
  );
}
