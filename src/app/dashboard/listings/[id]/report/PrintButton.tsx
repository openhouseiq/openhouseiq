"use client";

import { Button } from "@/components/ui/Button";

export function PrintButton() {
  return (
    <Button variant="primary" onClick={() => window.print()}>
      Print / save as PDF
    </Button>
  );
}
