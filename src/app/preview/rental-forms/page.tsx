import Link from "next/link";
import type { Metadata } from "next";
import { Wordmark } from "@/components/Wordmark";
import { RentalFormsPreview } from "./RentalFormsPreview";

export const metadata: Metadata = {
  title: "Design preview: state rental forms",
  robots: { index: false, follow: false },
};

export default function RentalFormsPreviewPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-5xl items-center px-6 py-6">
        <Link href="/" className="font-serif text-xl tracking-tight">
          <Wordmark tone="dark" />
        </Link>
      </header>
      <main className="mx-auto max-w-5xl px-6 pb-20">
        <h1 className="font-serif text-3xl font-medium text-ink">State rental forms and shortlist</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          A first look at how agents choose a state, what applicants see in each state
          built so far, and how the best-suited applicants are ranked.
        </p>
        <div className="mt-6">
          <RentalFormsPreview />
        </div>
      </main>
    </div>
  );
}
