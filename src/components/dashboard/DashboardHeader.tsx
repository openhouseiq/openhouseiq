import Link from "next/link";
import { LogoutButton } from "@/app/dashboard/LogoutButton";
import { Wordmark } from "@/components/Wordmark";
import { HeaderNav } from "@/components/dashboard/HeaderNav";

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
          <HeaderNav />
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
