"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
      <h1 className="font-serif text-2xl font-medium text-ink">
        Something went wrong
      </h1>
      <p className="max-w-sm text-sm text-ink-soft">
        An unexpected error occurred. You can try again, or head back to your
        dashboard.
      </p>
      <div className="flex gap-3">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <a href="/dashboard">
          <Button variant="secondary">Back to dashboard</Button>
        </a>
      </div>
    </div>
  );
}
