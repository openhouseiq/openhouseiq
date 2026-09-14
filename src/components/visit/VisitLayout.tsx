import type { ReactNode } from "react";

export function VisitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-line bg-paper-card p-6">
        <h1 className="mb-6 text-center font-serif text-xl tracking-tight">
          <span className="text-ink">OpenHouse</span>
          <span className="text-brass">IQ</span>
        </h1>

        {children}
      </div>
    </div>
  );
}
