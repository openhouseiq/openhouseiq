import { ValidationError } from "@/lib/validate";

// Custom questions: an agent can add up to 3 optional questions of their own
// to a listing's feedback form. Each is either a quick choice (the visitor
// taps Yes, No or Undecided) or a written answer. Answers are stored together
// with the question as it was worded when the visitor answered, so editing a
// question later never changes what an earlier visitor appears to have said.
//
// Listings saved before answer types existed hold plain strings; those are
// read as written-answer questions.

export const MAX_CUSTOM_QUESTIONS = 3;
export const CUSTOM_QUESTION_MAX = 140;
export const CUSTOM_ANSWER_MAX = 500;

export type CustomQuestionKind = "choice" | "text";

export type CustomQuestion = { text: string; kind: CustomQuestionKind };

export type CustomAnswer = { question: string; answer: string };

/** The answers a visitor can tap for a "choice" question. */
export const CHOICE_ANSWERS = ["Yes", "No", "Undecided"] as const;

function toQuestion(value: unknown, fallbackKind: CustomQuestionKind): CustomQuestion | null {
  if (typeof value === "string") {
    const text = value.trim().slice(0, CUSTOM_QUESTION_MAX);
    return text ? { text, kind: fallbackKind } : null;
  }
  if (value && typeof value === "object") {
    const { text, kind } = value as Record<string, unknown>;
    if (typeof text !== "string") return null;
    const trimmed = text.trim().slice(0, CUSTOM_QUESTION_MAX);
    if (!trimmed) return null;
    return { text: trimmed, kind: kind === "text" ? "text" : kind === "choice" ? "choice" : fallbackKind };
  }
  return null;
}

/** The agent's questions from the listing form fields: trimmed, blanks dropped, at most 3. */
export function cleanQuestions(values: { text: unknown; kind: unknown }[]): CustomQuestion[] {
  return values
    .map((v) => toQuestion({ text: v.text, kind: v.kind }, "choice"))
    .filter((q): q is CustomQuestion => q !== null)
    .slice(0, MAX_CUSTOM_QUESTIONS);
}

/** A listing's saved questions, read defensively from the database. */
export function parseQuestions(value: unknown): CustomQuestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => toQuestion(v, "text"))
    .filter((q): q is CustomQuestion => q !== null)
    .slice(0, MAX_CUSTOM_QUESTIONS);
}

/**
 * Pairs a visitor's answers (one per question, by position) with the
 * listing's questions. Blank answers are left out. Throws ValidationError for
 * anything that isn't a list of short strings, or a choice answer that isn't
 * Yes, No or Undecided.
 */
export function buildAnswers(questions: CustomQuestion[], raw: unknown): CustomAnswer[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw) || raw.length > MAX_CUSTOM_QUESTIONS) throw new ValidationError("Invalid answers");
  const answers: CustomAnswer[] = [];
  raw.forEach((value, i) => {
    if (value === null || value === undefined || value === "") return;
    if (typeof value !== "string") throw new ValidationError("Invalid answers");
    const answer = value.trim();
    if (answer.length > CUSTOM_ANSWER_MAX) throw new ValidationError("Invalid answers");
    const question = questions[i];
    if (!answer || !question) return;
    if (question.kind === "choice" && !(CHOICE_ANSWERS as readonly string[]).includes(answer)) {
      throw new ValidationError("Invalid answers");
    }
    answers.push({ question: question.text, answer });
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
