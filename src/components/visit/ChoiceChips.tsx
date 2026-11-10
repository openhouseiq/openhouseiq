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
  equalWidth = false,
}: {
  label: string;
  hint?: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T | null) => void;
  /** All options the same width, side by side on one row (for short sets like Yes / No / Undecided). */
  equalWidth?: boolean;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {hint ? <span className="ml-1 font-normal text-ink-soft">{hint}</span> : null}
      </legend>
      <div
        className={equalWidth ? "grid gap-1.5" : "flex flex-wrap gap-2"}
        style={equalWidth ? { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` } : undefined}
      >
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : option.value)}
              className={`inline-flex min-h-11 items-center justify-center gap-1 rounded-full bg-brass/10 py-2 font-medium text-brass-deep ${
                equalWidth ? "px-1 text-[13px] tracking-tight" : "px-4 text-sm"
              } ${selected ? "border-[3px] border-brass-deep" : "border-2 border-brass"}`}
            >
              {selected && !equalWidth ? (
                <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 shrink-0 fill-current">
                  <path d="M8.1 14.3 3.8 10l1.4-1.4 2.9 2.9 6.7-6.7 1.4 1.4z" />
                </svg>
              ) : null}
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
