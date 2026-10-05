"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your referral link:", link);
    }
  }

  return (
    <Button variant="primary" onClick={copy}>
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}
