import Link from "next/link";
import { LogoutButton } from "@/app/dashboard/LogoutButton";
import { Wordmark } from "@/components/Wordmark";

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
          <Link
            href="/dashboard/settings"
            className="whitespace-nowrap text-navy-soft hover:text-brass"
          >
            Settings
          </Link>
          <Link
            href="/dashboard/agency"
            className="whitespace-nowrap text-navy-soft hover:text-brass"
          >
            Agency
          </Link>
          <Link
            href="/dashboard/referrals"
            className="whitespace-nowrap text-navy-soft hover:text-brass"
          >
            Refer &amp; earn
          </Link>
          <Link
            href="/dashboard/contact"
            className="whitespace-nowrap text-navy-soft hover:text-brass"
          >
            Contact us
          </Link>
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
