// The agent's country decides local wording and how rent is quoted. Saved on
// the agent's profile (user_metadata.country) and copied to each listing, so
// visitor pages can use it without looking up the agent.

export type Country = "AU" | "NZ" | "US" | "CA";

export const COUNTRIES: { value: Country; label: string }[] = [
  { value: "AU", label: "Australia" },
  { value: "NZ", label: "New Zealand" },
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
];

export function parseCountry(value: unknown): Country {
  return value === "NZ" || value === "US" || value === "CA" ? value : "AU";
}

/** North American agents quote rent monthly and say "open house" and "closing". */
function isNorthAmerica(c: Country) {
  return c === "US" || c === "CA";
}

export function terms(country: unknown) {
  const c = parseCountry(country);
  const na = isNorthAmerica(c);
  return {
    openHome: na ? "open house" : "open home",
    OpenHome: na ? "Open house" : "Open home",
    rentPeriod: na ? "month" : "week",
    rentLabel: na ? "Monthly rent" : "Weekly rent",
    settlement: na ? "closing" : "settlement",
    Settlement: na ? "Closing" : "Settlement",
    waiveInspection: na
      ? "Willing to waive the home inspection"
      : c === "NZ"
        ? "Willing to waive the building inspection"
        : "Willing to waive building & pest inspection",
  };
}

/** Rent as a weekly figure, for ranking applicants against income. */
export function weeklyRent(price: number, country: unknown): number {
  return terms(country).rentPeriod === "month" ? (price * 12) / 52 : price;
}
