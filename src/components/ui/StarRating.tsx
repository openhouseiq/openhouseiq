export function StarRating({
  label,
  value,
  onChange,
  allowClear = false,
  inline = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** Tapping the current rating again clears it (for optional ratings). */
  allowClear?: boolean;
  /** Label on the left and stars on the right, on one line. */
  inline?: boolean;
}) {
  return (
    <div className={inline ? "flex items-center justify-between gap-3" : undefined}>
      <p className={`text-sm font-medium text-ink ${inline ? "" : "mb-0.5 block"}`}>{label}</p>
      <div className="flex shrink-0">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(allowClear && star === value ? 0 : star)}
            aria-label={`${label}: ${star} star${star > 1 ? "s" : ""}`}
            aria-pressed={star <= value}
            className={`flex h-10 w-10 items-center justify-center first:-ml-1.5 ${star <= value ? "text-brass" : "text-line"}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-current">
              <path d="M12 2.5l2.94 6.06 6.66.92-4.85 4.65 1.18 6.62L12 17.6l-5.93 3.15 1.18-6.62L2.4 9.48l6.66-.92L12 2.5z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
