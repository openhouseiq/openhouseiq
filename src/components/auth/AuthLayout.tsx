import type { ReactNode } from "react";

export function AuthLayout({
  headline,
  description,
  footer,
  children,
}: {
  headline: string;
  description: string;
  footer?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="hidden md:flex md:w-[42%] flex-col bg-ink px-10 py-16">
        <div className="flex flex-col items-center pt-8">
          <h1 className="font-serif text-3xl tracking-tight">
            <span className="text-paper">OpenHouse</span>
            <span className="text-brass">IQ</span>
          </h1>
          <div className="mt-6 mb-10 h-px w-12 bg-brass" />
          <h2 className="text-center font-serif text-2xl font-medium text-paper">
            {headline}
          </h2>
          <p className="mt-4 max-w-xs text-center text-sm leading-relaxed text-paper/70">
            {description}
          </p>
        </div>
        {footer ? (
          <p className="mt-auto pt-8 text-center text-xs text-paper/50">
            {footer}
          </p>
        ) : null}
      </div>

      <div className="flex w-full flex-1 items-center justify-center bg-paper-card px-6 py-12">
        <div className="w-full max-w-[380px]">
          <h1 className="mb-8 font-serif text-2xl tracking-tight md:hidden">
            <span className="text-ink">OpenHouse</span>
            <span className="text-brass">IQ</span>
          </h1>
          {children}
        </div>
      </div>
    </div>
  );
}
