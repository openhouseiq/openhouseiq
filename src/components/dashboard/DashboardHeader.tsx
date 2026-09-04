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
      <div className="flex items-center justify-between gap-3">
        <Link href="/dashboard" className="font-serif text-xl tracking-tight">
          <span className="text-ink">OpenHouse</span>
          <span className="text-brass">IQ</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/settings"
            className="text-sm text-ink-soft hover:text-pine"
          >
            {agentLabel}
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
