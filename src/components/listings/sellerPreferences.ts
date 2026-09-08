export const PRICE_OPTIONS: { value: string; label: string }[] = [
  { value: "not_a_priority", label: "Not a priority" },
  { value: "somewhat_important", label: "Somewhat important" },
  { value: "important", label: "Important" },
  { value: "very_important", label: "Very important" },
  { value: "top_priority", label: "Top priority" },
];

export const SETTLEMENT_OPTIONS: { value: string; label: string }[] = [
  { value: "asap", label: "As soon as possible" },
  { value: "30_days", label: "30 days" },
  { value: "45_days", label: "45 days" },
  { value: "60_days", label: "60 days" },
  { value: "90_plus_days", label: "90+ days" },
  { value: "flexible", label: "Flexible / no preference" },
];

export const LEVEL_OPTIONS: { value: string; label: string }[] = [
  { value: "no_preference", label: "No preference" },
  { value: "preferred", label: "Preferred" },
  { value: "required", label: "Required" },
];

export const PRICE_LABELS = Object.fromEntries(
  PRICE_OPTIONS.map((o) => [o.value, o.label]),
);
export const SETTLEMENT_LABELS = Object.fromEntries(
  SETTLEMENT_OPTIONS.map((o) => [o.value, o.label]),
);
export const LEVEL_LABELS = Object.fromEntries(
  LEVEL_OPTIONS.map((o) => [o.value, o.label]),
);
