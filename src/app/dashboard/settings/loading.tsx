import { Wordmark } from "@/components/Wordmark";

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-navy px-6 pb-6 pt-4">
        <span className="font-serif text-xl tracking-tight">
          <Wordmark tone="light" />
        </span>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-12" aria-busy="true">
        <div className="h-8 w-40 animate-pulse rounded-md bg-line" />
        <div className="mt-6 space-y-4">
          <div className="h-40 animate-pulse rounded-md border border-line bg-paper-card" />
          <div className="h-28 animate-pulse rounded-md border border-line bg-paper-card" />
          <div className="h-28 animate-pulse rounded-md border border-line bg-paper-card" />
        </div>
      </main>
    </div>
  );
}
