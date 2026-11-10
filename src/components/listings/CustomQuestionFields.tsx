import { CUSTOM_QUESTION_MAX, MAX_CUSTOM_QUESTIONS } from "@/lib/customQuestions";

const inputClasses =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink focus:border-brass focus:outline-none focus:ring-1 focus:ring-brass";

/** Up to 3 optional questions the agent adds to this listing's feedback form. Fields: customQuestion0..2. */
export function CustomQuestionFields({ defaults = [] }: { defaults?: string[] }) {
  return (
    <div className="space-y-3 rounded-md border border-line p-4">
      <div>
        <p className="text-sm font-medium text-ink">Your own questions (optional)</p>
        <p className="mt-1 text-xs text-ink-soft">
          Add up to {MAX_CUSTOM_QUESTIONS} questions to this listing&apos;s feedback form. Visitors can
          answer them or skip them. Leave blank to not ask anything extra.
        </p>
      </div>
      {Array.from({ length: MAX_CUSTOM_QUESTIONS }, (_, i) => (
        <div key={i}>
          <label htmlFor={`customQuestion${i}`} className="sr-only">
            Question {i + 1}
          </label>
          <input
            id={`customQuestion${i}`}
            name={`customQuestion${i}`}
            type="text"
            maxLength={CUSTOM_QUESTION_MAX}
            defaultValue={defaults[i] ?? ""}
            placeholder={
              i === 0
                ? "e.g. Are you also looking to sell a property?"
                : i === 1
                  ? "e.g. What would stop you making an offer?"
                  : `Question ${i + 1}`
            }
            className={inputClasses}
          />
        </div>
      ))}
    </div>
  );
}

/** Reads the three customQuestion fields from a submitted listing form. */
export function questionsFromForm(formData: FormData): unknown[] {
  return Array.from({ length: MAX_CUSTOM_QUESTIONS }, (_, i) => formData.get(`customQuestion${i}`));
}
