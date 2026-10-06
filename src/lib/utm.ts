import { UTM_COOKIE } from "@/components/UtmCapture";

export type UtmData = Partial<
  Record<"utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term", string>
>;

/** Reads whatever UtmCapture stashed on first visit. Client-side only. */
export function readUtmCookie(): UtmData {
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(UTM_COOKIE + "="));
  if (!match) return {};

  try {
    return JSON.parse(decodeURIComponent(match.slice(UTM_COOKIE.length + 1)));
  } catch {
    return {};
  }
}
