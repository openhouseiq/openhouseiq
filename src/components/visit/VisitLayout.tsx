import type { ReactNode } from "react";

export function VisitLayout({
  children,
  photoUrls,
}: {
  children: ReactNode;
  photoUrls?: string[];
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-line bg-paper-card p-6">
        <h1 className="mb-6 text-center font-serif text-xl tracking-tight">
          <span className="text-ink">OpenHouse</span>
          <span className="text-brass">IQ</span>
        </h1>

        {photoUrls && photoUrls.length > 0 ? (
          <div className="mb-6 flex gap-2 overflow-x-auto">
            {photoUrls.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt=""
                className="h-28 w-28 flex-shrink-0 rounded-md border border-line object-cover"
              />
            ))}
          </div>
        ) : null}

        {children}
      </div>
    </div>
  );
}
