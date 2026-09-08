"use client";

import { useState } from "react";
import { PasswordForm } from "./PasswordForm";

export function PasswordSection() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-pine underline"
      >
        Change password
      </button>
    );
  }

  return <PasswordForm />;
}
