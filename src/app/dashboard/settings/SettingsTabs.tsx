"use client";

import { useSearchParams } from "next/navigation";

export const SETTINGS_TABS = [
  { id: "profile", label: "Profile" },
  { id: "billing", label: "Billing" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact us" },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];

export const isSettingsTab = (v: unknown): v is SettingsTab =>
  typeof v === "string" && SETTINGS_TABS.some((t) => t.id === v);

/** The tab in the address bar (?tab=…), read in the browser so switching is instant. */
export function useSettingsTab(): SettingsTab {
  const tab = useSearchParams().get("tab");
  return isSettingsTab(tab) ? tab : "profile";
}

/** The page heading for whichever tab is showing. */
export function SettingsTitle() {
  const tab = useSettingsTab();
  return (
    <h1 className="font-serif text-2xl font-medium text-ink">
      {SETTINGS_TABS.find((t) => t.id === tab)?.label}
    </h1>
  );
}

/**
 * Shows its children only on its own tab. Every tab is sent with the page,
 * so moving between Profile, Billing, FAQ and Contact us needs no trip to
 * the server.
 */
export function SettingsPanel({ tab, children }: { tab: SettingsTab; children: React.ReactNode }) {
  const active = useSettingsTab();
  return (
    <div hidden={active !== tab} className="space-y-4">
      {children}
    </div>
  );
}
