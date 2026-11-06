import type { ReactNode } from "react";
import { Wordmark } from "@/components/Wordmark";

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
      <div className="hidden md:flex md:w-[42%] flex-col bg-navy px-10 py-16">
        <div className="flex flex-col items-center pt-8">
          <div className="font-serif text-3xl tracking-tight">
            <Wordmark tone="light" />
          </div>
          <div className="mt-6 mb-10 h-px w-12 bg-brass" />
          <p className="text-center font-serif text-2xl font-medium text-paper">
            {headline}
          </p>
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

      <div className="flex w-full flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 font-serif text-2xl tracking-tight md:hidden">
            <Wordmark tone="dark" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
