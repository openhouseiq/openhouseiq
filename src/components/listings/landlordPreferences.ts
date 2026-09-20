export const PETS_OPTIONS: { value: string; label: string }[] = [
  { value: "no_preference", label: "No preference" },
  { value: "not_allowed", label: "Not allowed" },
  { value: "allowed", label: "Allowed" },
];

export const LEASE_TERM_OPTIONS: { value: string; label: string }[] = [
  { value: "month_to_month", label: "Month to month" },
  { value: "6_months", label: "6 months" },
  { value: "12_months", label: "12 months" },
  { value: "24_months", label: "24 months" },
  { value: "flexible", label: "Flexible / no minimum" },
];

export const APPLICANT_LEASE_TERM_OPTIONS: { value: string; label: string }[] =
  LEASE_TERM_OPTIONS.filter((option) => option.value !== "flexible");

export const SMOKING_OPTIONS: { value: string; label: string }[] = [
  { value: "no_preference", label: "No preference" },
  { value: "not_allowed", label: "Not allowed" },
  { value: "allowed", label: "Allowed" },
];

export const EMPLOYMENT_VERIFICATION_OPTIONS: { value: string; label: string }[] = [
  { value: "no_preference", label: "No preference" },
  { value: "preferred", label: "Preferred" },
  { value: "required", label: "Required" },
];

export const INCOME_RANGE_OPTIONS: { value: string; label: string }[] = [
  { value: "under_50k", label: "Under $50k" },
  { value: "50k_75k", label: "$50k–$75k" },
  { value: "75k_100k", label: "$75k–$100k" },
  { value: "100k_150k", label: "$100k–$150k" },
  { value: "150k_plus", label: "$150k+" },
];

export const PETS_LABELS = Object.fromEntries(
  PETS_OPTIONS.map((o) => [o.value, o.label]),
);
export const LEASE_TERM_LABELS = Object.fromEntries(
  LEASE_TERM_OPTIONS.map((o) => [o.value, o.label]),
);
export const SMOKING_LABELS = Object.fromEntries(
  SMOKING_OPTIONS.map((o) => [o.value, o.label]),
);
export const EMPLOYMENT_VERIFICATION_LABELS = Object.fromEntries(
  EMPLOYMENT_VERIFICATION_OPTIONS.map((o) => [o.value, o.label]),
);
export const INCOME_RANGE_LABELS = Object.fromEntries(
  INCOME_RANGE_OPTIONS.map((o) => [o.value, o.label]),
);
