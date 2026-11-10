import { parseAnswers } from "@/lib/customQuestions";

/** A visitor's answers to the agent's own questions, shown under their feedback. */
export function CustomAnswerList({ value }: { value: unknown }) {
  const answers = parseAnswers(value);
  if (answers.length === 0) return null;
  return (
    <dl className="mt-2 space-y-1 rounded-md bg-paper px-3 py-2 text-sm">
      {answers.map((a, i) => (
        <div key={i}>
          <dt className="text-xs text-ink-soft">{a.question}</dt>
          <dd className="text-ink">{a.answer}</dd>
        </div>
      ))}
    </dl>
  );
}
