import Link from "next/link";

export const SETTINGS_TABS = [
  { id: "profile", label: "Profile" },
  { id: "billing", label: "Billing" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact us" },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];

export const isSettingsTab = (v: unknown): v is SettingsTab =>
  typeof v === "string" && SETTINGS_TABS.some((t) => t.id === v);

export function SettingsTabs({ active }: { active: SettingsTab }) {
  return (
    <nav aria-label="Settings sections" className="mt-6 border-b border-line">
      <ul className="-mb-px flex gap-6 overflow-x-auto">
        {SETTINGS_TABS.map((t) => {
          const isActive = t.id === active;
          return (
            <li key={t.id}>
              <Link
                href={t.id === "profile" ? "/dashboard/settings" : `/dashboard/settings?tab=${t.id}`}
                aria-current={isActive ? "page" : undefined}
                className={`inline-block whitespace-nowrap border-b-2 pb-3 font-serif text-lg ${
                  isActive
                    ? "border-brass font-medium text-ink"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
