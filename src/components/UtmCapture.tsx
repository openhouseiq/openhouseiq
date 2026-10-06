"use client";

import { useEffect } from "react";

export const UTM_COOKIE = "cp_utm";
const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

export function UtmCapture() {
  useEffect(() => {
    // First-touch attribution: once a source is captured, later visits
    // (e.g. someone clicking a second post before signing up) don't
    // overwrite it.
    if (document.cookie.split("; ").some((c) => c.startsWith(UTM_COOKIE + "="))) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const source: Record<string, string> = {};
    for (const key of UTM_PARAMS) {
      const value = params.get(key);
      if (value) source[key] = value;
    }
    if (Object.keys(source).length === 0) return;

    const maxAge = 60 * 60 * 24 * 30; // 30 days
    document.cookie = `${UTM_COOKIE}=${encodeURIComponent(JSON.stringify(source))}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }, []);

  return null;
}
