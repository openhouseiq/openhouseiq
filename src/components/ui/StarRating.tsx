export function StarRating({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            className={`text-2xl ${star <= value ? "text-brass" : "text-line"}`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
