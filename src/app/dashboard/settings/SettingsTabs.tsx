export const SETTINGS_TABS = [
  { id: "profile", label: "Profile" },
  { id: "billing", label: "Billing" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact us" },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];

export const isSettingsTab = (v: unknown): v is SettingsTab =>
  typeof v === "string" && SETTINGS_TABS.some((t) => t.id === v);
