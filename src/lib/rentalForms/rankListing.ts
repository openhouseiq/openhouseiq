// Ranks a listing's rental applications for the dashboard and the printable report.

import { getRentalForm } from "./index";
import { agentConfigComplete } from "./answers";
import { rankApplicants } from "./ranking";
import { rankingContext, toRankable } from "./rankable";
import type { Listing, RentalApplication, RentalApplicationStatus } from "@/lib/types";

export type RankedItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  score: number;
  positives: string[];
  concerns: string[];
  unmet: string[];
  status: RentalApplicationStatus;
  createdAt: string;
  answers: Record<string, unknown>;
  isNew: boolean;
};

const LEASE_MONTHS: Record<string, number> = { "6_months": 6, "12_months": 12, "24_months": 24 };

export function rankListingApplications(listing: Listing, apps: RentalApplication[]) {
  const form = getRentalForm(listing.state);
  if (!form) return { form: null, ready: false, items: [] as RankedItem[], notRanked: [] as string[] };

  const config = (listing.rental_config ?? {}) as Record<string, unknown>;
  const settings = (config.ranking ?? {}) as {
    maxRentShare?: number | null;
    preferredMoveIn?: string | null;
  };
  const ctx = rankingContext(form, listing.price, {
    ...settings,
    minLeaseMonths: listing.landlord_pref_min_lease_term
      ? (LEASE_MONTHS[listing.landlord_pref_min_lease_term] ?? null)
      : null,
    petsAllowed:
      listing.landlord_pref_pets === "not_allowed"
        ? false
        : listing.landlord_pref_pets === "allowed"
          ? true
          : null,
  });
  const byId = new Map(apps.map((a) => [a.id, a]));
  const items = rankApplicants(
    apps.map((a) => toRankable(form, a.id, a.answers, config)),
    ctx,
  ).map((r): RankedItem => {
    const app = byId.get(r.id)!;
    return {
      id: r.id,
      name: app.applicant_name ?? "Applicant",
      email: app.email,
      phone: app.phone,
      score: r.score,
      positives: r.positives,
      concerns: r.concerns,
      unmet: r.unmet,
      status: app.status,
      createdAt: app.created_at,
      answers: app.answers,
      isNew: !app.read_at,
    };
  });
  const notRanked = [
    !form.rankingInputs.income ? "income" : null,
    !form.rankingInputs.history ? "rental history" : null,
    !form.rankingInputs.pets ? "pets" : null,
  ].filter((v): v is string => v !== null);

  return { form, ready: agentConfigComplete(form, config), items, notRanked };
}
