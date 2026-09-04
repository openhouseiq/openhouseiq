import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center">
      <h1 className="font-serif text-3xl tracking-tight">
        <span className="text-ink">OpenHouse</span>
        <span className="text-brass">IQ</span>
      </h1>
      <p className="font-serif text-xl font-medium text-ink">Page not found</p>
      <p className="max-w-sm text-sm text-ink-soft">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved.
      </p>
      <Link href="/dashboard">
        <Button variant="primary">Back to dashboard</Button>
      </Link>
    </div>
  );
}
