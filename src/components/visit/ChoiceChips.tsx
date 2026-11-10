"use client";

/**
 * A row of big tap targets for picking one option, used instead of dropdowns
 * on visitor forms (one tap on a phone instead of open-scroll-pick-close).
 * Tapping the chosen option again clears it, so an optional question can be
 * un-answered.
 */
export function ChoiceChips<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T | null) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {hint ? <span className="ml-1 font-normal text-ink-soft">{hint}</span> : null}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : option.value)}
              className={`min-h-11 rounded-full border px-4 py-2 text-sm ${
                selected
                  ? "border-brass bg-brass font-medium text-ink"
                  : "border-line bg-white text-ink-soft hover:border-brass"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
