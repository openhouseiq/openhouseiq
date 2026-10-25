// Turns a stored submission into the few inputs the ranking may use. Anything
// not listed here (age, gender, ethnicity, disability, family status or number
// of children, smoking, bank transactions, free text) cannot affect the score.

import type { RankableApplicant, RankingContext } from "./ranking";
import type { RentalFormDefinition, RentalState } from "./types";

type Answers = Record<string, unknown>;

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

const DAY = 86_400_000;

function toWeekly(amount: number | null, frequency: unknown): number | null {
  if (amount === null) return null;
  if (frequency === "fortnight") return amount / 2;
  if (frequency === "month") return (amount * 12) / 52;
  return amount;
}

function monthsBetween(start: unknown, end: unknown, now: Date): number {
  const a = str(start);
  if (!a) return 0;
  const from = new Date(a).getTime();
  const to = str(end) ? new Date(str(end) as string).getTime() : now.getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return 0;
  return Math.round((to - from) / (DAY * 30.4));
}

function weeklyIncome(state: RentalState, a: Answers): number | null {
  switch (state) {
    case "QLD":
      return num(a.gross_weekly_income);
    case "VIC":
      return num(a.net_weekly_income);
    case "NT":
    case "NSW":
      return num(a.weekly_income);
    case "WA": {
      const main = toWeekly(num(a.net_income), a.net_income_frequency);
      const other = toWeekly(num(a.other_income), a.other_income_frequency);
      return main === null && other === null ? null : (main ?? 0) + (other ?? 0);
    }
    default:
      return null; // SA's form has no income question
  }
}

function historyMonths(state: RentalState, a: Answers, now: Date): number {
  if (state === "QLD" || state === "VIC") {
    return (
      monthsBetween(a.history_1_start, a.history_1_end, now) +
      monthsBetween(a.history_2_start, a.history_2_end, now)
    );
  }
  if (state === "WA") return monthsBetween(a.history_from, a.history_to, now);
  return 0;
}

function refereeCount(state: RentalState, a: Answers): number {
  switch (state) {
    case "NT":
      return str(a.referee_name) ? 1 : 0;
    case "NSW":
      return str(a.landlord_name) ? 1 : 0;
    default:
      return [a.referee_1_name, a.referee_2_name].filter((v) => str(v)).length;
  }
}

function leaseMonths(a: Answers): number | null {
  const v = str(a.lease_term);
  const m = v ? /^(\d+)_months$/.exec(v) : null;
  return m ? Number(m[1]) : null;
}

/** Document requested by the agent for an applicant "acknowledge" field. */
function requestedDocFor(ackId: string, config: Answers): boolean {
  const NT: Record<string, string> = { identity_ack: "identity_primary", pay_ack: "pay_doc_1" };
  const docId =
    NT[ackId] ?? ackId.replace("_ack", "_doc");
  const v = config[docId];
  return typeof v === "string" && v !== "" && v !== "not_requested";
}

function documents(form: RentalFormDefinition, a: Answers, config: Answers) {
  let requested = 0;
  let provided = 0;
  for (const section of form.applicantSections) {
    for (const f of section.fields) {
      if (!f.id.includes("_ack")) continue;
      if (!requestedDocFor(f.id, config)) continue;
      requested += 1;
      if (a[f.id] === "provide" || a[f.id] === "show") provided += 1;
    }
  }
  return { requested, provided };
}

export function toRankable(
  form: RentalFormDefinition,
  id: string,
  answers: Answers,
  config: Answers,
  now = new Date(),
): RankableApplicant {
  const docs = documents(form, answers, config);
  return {
    id,
    name: str(answers.full_name) ?? "Applicant",
    weeklyIncome: weeklyIncome(form.state, answers),
    historyMonths: historyMonths(form.state, answers, now),
    referees: refereeCount(form.state, answers),
    moveInDate: str(answers.move_in_date),
    leaseMonths: leaseMonths(answers),
    intendsPets: answers.pets_intend === true || answers.has_pets === true,
    documentsRequested: docs.requested,
    documentsProvided: docs.provided,
  };
}

/** Landlord settings for ranking, from the listing's saved settings. */
export function rankingContext(
  form: RentalFormDefinition,
  weeklyRent: number,
  settings: {
    maxRentShare?: number | null;
    preferredMoveIn?: string | null;
    minLeaseMonths?: number | null;
    petsAllowed?: boolean | null;
  },
): RankingContext {
  return {
    weeklyRent,
    maxRentShare: settings.maxRentShare ?? 0.3,
    preferredMoveIn: settings.preferredMoveIn ?? null,
    minLeaseMonths: settings.minLeaseMonths ?? null,
    petsAllowed: settings.petsAllowed ?? null,
    available: form.rankingInputs,
  };
}
