export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="bg-navy px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="font-serif text-xl tracking-tight">
            <span className="text-brass">C</span>
            <span className="text-paper">ue</span>
            <span className="text-brass">P</span>
            <span className="text-paper">roperty</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="h-9 w-48 animate-pulse rounded-md bg-line" />
        <div className="mt-8 space-y-3">
          <div className="h-20 animate-pulse rounded-md border border-line bg-paper-card" />
          <div className="h-20 animate-pulse rounded-md border border-line bg-paper-card" />
          <div className="h-20 animate-pulse rounded-md border border-line bg-paper-card" />
        </div>
      </main>
    </div>
  );
}
