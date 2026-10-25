// Ranks applicants using ONLY information that is on the official state forms.
// Never used: age or date of birth, gender, ethnicity, disability, family
// status or number of children, smoking, bank transactions, or free text.

export type RankingContext = {
  weeklyRent: number;
  /** Share of weekly income the rent may take before affordability drops. */
  maxRentShare: number;
  preferredMoveIn: string | null;
  minLeaseMonths: number | null;
  petsAllowed: boolean | null;
};

export type RankableApplicant = {
  id: string;
  name: string;
  weeklyIncome: number | null;
  historyMonths: number;
  referees: number;
  moveInDate: string | null;
  leaseMonths: number | null;
  intendsPets: boolean;
  documentsRequested: number;
  documentsProvided: number;
};

export type RankedApplicant = RankableApplicant & {
  score: number;
  positives: string[];
  concerns: string[];
  unmet: string[];
};

const DAY = 86_400_000;

function affordabilityPoints(share: number, max: number): number {
  if (share <= max) return 40;
  if (share <= max + 0.05) return 30;
  if (share <= max + 0.1) return 20;
  if (share <= max + 0.2) return 8;
  return 0;
}

export function rankApplicants(
  applicants: RankableApplicant[],
  ctx: RankingContext,
): RankedApplicant[] {
  const ranked = applicants.map((a): RankedApplicant => {
    const positives: string[] = [];
    const concerns: string[] = [];
    const unmet: string[] = [];
    let score = 0;

    // Affordability (40)
    if (a.weeklyIncome && a.weeklyIncome > 0) {
      const share = ctx.weeklyRent / a.weeklyIncome;
      const pts = affordabilityPoints(share, ctx.maxRentShare);
      score += pts;
      const pct = Math.round(share * 100);
      (pts >= 30 ? positives : concerns).push(`Rent is ${pct}% of weekly income`);
    } else {
      concerns.push("No income stated");
    }

    // Rental history (25)
    if (a.historyMonths >= 24) {
      score += 25;
      positives.push(`${a.historyMonths} months of rental history`);
    } else if (a.historyMonths >= 12) {
      score += 15;
      positives.push(`${a.historyMonths} months of rental history`);
    } else if (a.historyMonths > 0) {
      score += 8;
      concerns.push(`Only ${a.historyMonths} months of rental history`);
    } else {
      concerns.push("No rental history given");
    }

    // References (15)
    if (a.referees >= 2) {
      score += 15;
      positives.push("Two referees given");
    } else if (a.referees === 1) {
      score += 8;
      concerns.push("Only one referee");
    } else {
      concerns.push("No referees given");
    }

    // Fit (10): move-in date 5, lease term 5
    if (ctx.preferredMoveIn && a.moveInDate) {
      const diff = Math.abs(new Date(a.moveInDate).getTime() - new Date(ctx.preferredMoveIn).getTime()) / DAY;
      if (diff <= 14) {
        score += 5;
        positives.push("Move-in date suits the landlord");
      } else if (diff <= 30) {
        score += 3;
      } else {
        concerns.push("Move-in date is more than a month from the landlord's");
      }
    }
    if (ctx.minLeaseMonths && a.leaseMonths) {
      if (a.leaseMonths >= ctx.minLeaseMonths) {
        score += 5;
        positives.push(`${a.leaseMonths}-month lease meets the minimum`);
      } else {
        concerns.push(`Wants ${a.leaseMonths} months, landlord wants ${ctx.minLeaseMonths}+`);
      }
    }

    // Documents (10)
    if (a.documentsRequested > 0) {
      score += Math.round((a.documentsProvided / a.documentsRequested) * 10);
      if (a.documentsProvided < a.documentsRequested) {
        concerns.push(`${a.documentsRequested - a.documentsProvided} requested document(s) not yet covered`);
      } else {
        positives.push("All requested documents covered");
      }
    }

    // Landlord condition (not scored): pets
    if (ctx.petsAllowed === false && a.intendsPets) {
      unmet.push("Intends to keep pets (landlord policy: no pets)");
    }

    return { ...a, score: Math.min(100, score), positives, concerns, unmet };
  });

  return ranked.sort((x, y) => x.unmet.length - y.unmet.length || y.score - x.score);
}
