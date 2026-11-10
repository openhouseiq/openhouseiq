/** Reads what a buyer typed as a whole-dollar amount: "750000", "$750,000", "750k", "1.2m". */
export function parseOfferAmount(input: string): number | null {
  const cleaned = input.toLowerCase().replace(/[$,\s]/g, "");
  const match = cleaned.match(/^(\d+(?:\.\d+)?)(k|m)?$/);
  if (!match) return null;
  const multiplier = match[2] === "m" ? 1_000_000 : match[2] === "k" ? 1_000 : 1;
  const amount = Math.round(Number(match[1]) * multiplier);
  return amount > 0 ? amount : null;
}
