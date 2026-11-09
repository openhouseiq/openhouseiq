import { Wordmark } from "@/components/Wordmark";

export default function ListingLoading() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-navy px-6 pb-6 pt-4">
        <span className="font-serif text-xl tracking-tight">
          <Wordmark tone="light" />
        </span>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-12" aria-busy="true">
        <div className="h-9 w-72 animate-pulse rounded-md bg-line" />
        <div className="mt-3 h-5 w-56 animate-pulse rounded-md bg-line" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="h-48 animate-pulse rounded-md border border-line bg-paper-card" />
          <div className="h-48 animate-pulse rounded-md border border-line bg-paper-card" />
        </div>
        <div className="mt-6 h-64 animate-pulse rounded-md border border-line bg-paper-card" />
      </main>
    </div>
  );
}
