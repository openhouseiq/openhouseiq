import { CrmSendError } from "./errors";

// Shared plumbing for the CRMs that agents connect with their own API key
// (Lofty, HubSpot, Pipedrive). Each CRM file supplies its URL and headers;
// this turns network problems and HTTP status codes into CrmSendErrors the
// send queue understands (retry later, give up, or ask the agent to reconnect).

export type Fetch = typeof fetch;

export type CrmResponse = { status: number; text: string; json: Record<string, unknown> | null };

export async function crmRequest(
  crmName: string,
  url: string,
  init: { method: string; headers: Record<string, string>; body?: unknown },
  fetchImpl: Fetch = fetch,
  /** Statuses to hand back to the caller instead of throwing (e.g. HubSpot's 409 "already exists"). */
  passThrough: number[] = [],
): Promise<CrmResponse> {
  let res: Response;
  try {
    res = await fetchImpl(url, {
      method: init.method,
      headers: { Accept: "application/json", "Content-Type": "application/json", ...init.headers },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new CrmSendError(`Couldn't reach ${crmName}: ${(error as Error).message}`, true);
  }
  const text = await res.text().catch(() => "");
  let json: Record<string, unknown> | null = null;
  try {
    json = text ? (JSON.parse(text) as Record<string, unknown>) : null;
  } catch {
    json = null;
  }
  if (res.ok || passThrough.includes(res.status)) return { status: res.status, text, json };

  const detail = text.slice(0, 300);
  if (res.status === 401 || res.status === 403) {
    throw new CrmSendError(`${crmName} refused access (${res.status}). ${detail}`.trim(), false, true);
  }
  if (res.status === 429 || res.status >= 500) {
    throw new CrmSendError(`${crmName} is busy or down (${res.status}).`, true);
  }
  throw new CrmSendError(`${crmName} rejected the record (${res.status}). ${detail}`.trim(), false);
}

export function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  const firstName = parts.shift() ?? full.trim();
  return { firstName, lastName: parts.join(" ") };
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A CRM record's subject and body as simple HTML (for CRMs whose notes are HTML). */
export function noteHtml(subject: string, body: string): string {
  return `<p><strong>${escapeHtml(subject)}</strong></p><p>${escapeHtml(body).replace(/\n/g, "<br>")}</p>`;
}
