"use client";

import { useEffect, useState } from "react";

// Remembers a visitor's name, email and phone on their own phone, so they
// don't retype them for an offer after leaving feedback, or at the next open
// home. Stored only in that browser (localStorage), never sent anywhere until
// they submit a form. Every read and write is wrapped, because storage can be
// blocked (private browsing) and the forms must work without it.

const KEY = "ohh-visitor-details";

export type VisitorDetails = { name: string; email: string; phone: string };

const EMPTY: VisitorDetails = { name: "", email: "", phone: "" };

function load(): VisitorDetails | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<VisitorDetails>;
    const details = {
      name: typeof parsed.name === "string" ? parsed.name : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
    };
    return details.name || details.email || details.phone ? details : null;
  } catch {
    return null;
  }
}

export function saveVisitorDetails(details: VisitorDetails): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(details));
  } catch {
    // Storage blocked: nothing to remember, the form still worked.
  }
}

function clear(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Controlled name/email/phone values, pre-filled from this phone if the visitor has used a form before. */
export function useVisitorDetails() {
  const [details, setDetails] = useState<VisitorDetails>(EMPTY);
  const [remembered, setRemembered] = useState(false);

  useEffect(() => {
    const saved = load();
    if (saved) {
      // Pre-fill once on mount, from this browser's own storage.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDetails(saved);
      setRemembered(true);
    }
  }, []);

  return {
    details,
    remembered,
    set: (field: keyof VisitorDetails, value: string) => setDetails((d) => ({ ...d, [field]: value })),
    forget: () => {
      clear();
      setDetails(EMPTY);
      setRemembered(false);
    },
  };
}
