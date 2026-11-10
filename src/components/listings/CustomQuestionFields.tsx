import {
  CUSTOM_QUESTION_MAX,
  MAX_CUSTOM_QUESTIONS,
  type CustomQuestion,
} from "@/lib/customQuestions";

const inputClasses =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass";

const PLACEHOLDERS = [
  "e.g. Are you looking to sell a property?",
  "e.g. Would you like to hear about similar properties?",
  "Question 3",
];

/**
 * Up to 3 optional questions the agent adds to this listing's feedback form.
 * Each has an answer type: Yes / No / Undecided buttons (quickest for
 * visitors, the default) or a written answer.
 * Fields: customQuestion0..2 and customQuestionKind0..2.
 */
export function CustomQuestionFields({ defaults = [] }: { defaults?: CustomQuestion[] }) {
  return (
    <div className="space-y-3 rounded-md border border-line p-4">
      <div>
        <p className="text-sm font-medium text-ink">Your own questions (optional)</p>
        <p className="mt-1 text-xs text-ink-soft">
          Add up to {MAX_CUSTOM_QUESTIONS} questions to this listing&apos;s sign-in form. Visitors
          can answer or skip them. Yes / No / Undecided is quickest for visitors: they just tap.
        </p>
      </div>
      {Array.from({ length: MAX_CUSTOM_QUESTIONS }, (_, i) => (
        <div key={i} className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor={`customQuestion${i}`} className="sr-only">
              Question {i + 1}
            </label>
            <input
              id={`customQuestion${i}`}
              name={`customQuestion${i}`}
              type="text"
              maxLength={CUSTOM_QUESTION_MAX}
              defaultValue={defaults[i]?.text ?? ""}
              placeholder={PLACEHOLDERS[i]}
              className={inputClasses}
            />
          </div>
          <div>
            <label htmlFor={`customQuestionKind${i}`} className="sr-only">
              Answer type for question {i + 1}
            </label>
            <select
              id={`customQuestionKind${i}`}
              name={`customQuestionKind${i}`}
              defaultValue={defaults[i]?.kind ?? "choice"}
              className={inputClasses}
            >
              <option value="choice">Yes / No / Undecided</option>
              <option value="text">Written answer</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Reads the question and answer-type fields from a submitted listing form. */
export function questionsFromForm(formData: FormData): { text: unknown; kind: unknown }[] {
  return Array.from({ length: MAX_CUSTOM_QUESTIONS }, (_, i) => ({
    text: formData.get(`customQuestion${i}`),
    kind: formData.get(`customQuestionKind${i}`),
  }));
}
