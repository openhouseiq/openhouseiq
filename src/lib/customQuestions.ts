import { ValidationError } from "@/lib/validate";

// Custom questions: an agent can add up to 3 optional questions of their own
// to a listing's feedback form. Answers are stored together with the question
// as it was worded when the visitor answered, so editing a question later
// never changes what an earlier visitor appears to have said.

export const MAX_CUSTOM_QUESTIONS = 3;
export const CUSTOM_QUESTION_MAX = 140;
export const CUSTOM_ANSWER_MAX = 500;

export type CustomAnswer = { question: string; answer: string };

/** The agent's questions from the listing form fields: trimmed, blanks dropped, at most 3. */
export function cleanQuestions(values: unknown[]): string[] {
  return values
    .map((v) => (typeof v === "string" ? v.trim().slice(0, CUSTOM_QUESTION_MAX) : ""))
    .filter((v) => v !== "")
    .slice(0, MAX_CUSTOM_QUESTIONS);
}

/** A listing's saved questions, read defensively from the database. */
export function parseQuestions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return cleanQuestions(value);
}

/**
 * Pairs a visitor's answers (one per question, by position) with the
 * listing's questions. Blank answers are left out. Throws ValidationError for
 * anything that isn't a list of short strings.
 */
export function buildAnswers(questions: string[], raw: unknown): CustomAnswer[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw) || raw.length > MAX_CUSTOM_QUESTIONS) throw new ValidationError("Invalid answers");
  const answers: CustomAnswer[] = [];
  raw.forEach((value, i) => {
    if (value === null || value === undefined || value === "") return;
    if (typeof value !== "string") throw new ValidationError("Invalid answers");
    const answer = value.trim();
    if (answer.length > CUSTOM_ANSWER_MAX) throw new ValidationError("Invalid answers");
    const question = questions[i];
    if (answer && question) answers.push({ question, answer });
  });
  return answers;
}

/** Saved answers, read defensively from the database. */
export function parseAnswers(value: unknown): CustomAnswer[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const { question, answer } = item as Record<string, unknown>;
    return typeof question === "string" && typeof answer === "string" ? [{ question, answer }] : [];
  });
}
