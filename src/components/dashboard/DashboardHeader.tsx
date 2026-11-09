import Link from "next/link";
import { LogoutButton } from "@/app/dashboard/LogoutButton";
import { Wordmark } from "@/components/Wordmark";

const NAV = [
  { label: "Profile", href: "/dashboard/settings" },
  { label: "Billing", href: "/dashboard/settings?tab=billing" },
  { label: "FAQ", href: "/dashboard/settings?tab=faq" },
  { label: "Contact us", href: "/dashboard/settings?tab=contact" },
];

export function DashboardHeader({
  agentLabel,
  backHref,
  backLabel,
}: {
  agentLabel: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <header className="bg-navy px-6 pb-6 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Link
          href="/dashboard"
          className="whitespace-nowrap font-serif text-xl tracking-tight"
        >
          <Wordmark tone="light" />
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-navy-soft hover:text-brass"
            >
              {item.label}
            </Link>
          ))}
          <div className="relative">
            <LogoutButton />
            {agentLabel ? (
              <span className="absolute right-0 top-full mt-1 max-w-[14rem] truncate whitespace-nowrap text-xs text-navy-soft">
                {agentLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      {backHref ? (
        <Link
          href={backHref}
          className="mt-2 inline-block text-sm text-brass underline"
        >
          {backLabel ?? "Back"}
        </Link>
      ) : null}
    </header>
  );
}
