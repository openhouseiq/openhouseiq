import Link from "next/link";
import { LogoutButton } from "@/app/dashboard/LogoutButton";

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
    <header className="border-b border-line bg-paper-card px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Link
          href="/dashboard"
          className="whitespace-nowrap font-serif text-xl tracking-tight"
        >
          <span className="text-ink">Cue</span>
          <span className="text-brass">Property</span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-x-4 whitespace-nowrap text-ink-soft hover:text-pine"
          >
            <span>{agentLabel}</span>
            <span>Settings</span>
          </Link>
          <Link
            href="/dashboard/settings#contact"
            className="whitespace-nowrap text-ink-soft hover:text-pine"
          >
            Contact us
          </Link>
          <LogoutButton />
        </div>
      </div>
      {backHref ? (
        <Link href={backHref} className="mt-2 inline-block text-sm text-pine underline">
          {backLabel ?? "Back"}
        </Link>
      ) : null}
    </header>
  );
}
