"use client";

// The robot check (Cloudflare Turnstile) runs by itself in the background.
// If a quick visitor taps Submit before it has finished, wait a few seconds
// for it instead of failing, and reset it after a rejected attempt so trying
// again just works.

type TurnstileApi = { reset: (widget?: string | HTMLElement) => void };

function readToken(form: HTMLFormElement): string {
  const input = form.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]');
  return input?.value ?? "";
}

/** The robot-check token, waiting up to `maxMs` for it. "" if the check isn't on this page or never finished. */
export async function waitForTurnstileToken(form: HTMLFormElement, maxMs = 8000): Promise<string> {
  if (!form.querySelector(".cf-turnstile")) return "";
  const started = Date.now();
  let token = readToken(form);
  while (!token && Date.now() - started < maxMs) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    token = readToken(form);
  }
  return token;
}

/** Starts a fresh robot check (a token can only be used once). */
export function resetTurnstile(): void {
  try {
    (window as unknown as { turnstile?: TurnstileApi }).turnstile?.reset();
  } catch {
    // ignore
  }
}
