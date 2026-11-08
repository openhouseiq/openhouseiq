import type { CrmRecord } from "./record";
import { CrmSendError } from "./errors";

// Follow Up Boss (popular with US agents). Built from the published API docs:
//   https://docs.followupboss.com/docs                (start here)
//   https://docs.followupboss.com/docs/identification (X-System headers)
//   POST /v1/events is "the preferred way to send in contacts".
//
// Every request carries OUR registered system name and key (FUB_SYSTEM and
// FUB_SYSTEM_KEY, from apps.followupboss.com/system-registration) and the
// agent's own API key (Admin → API in Follow Up Boss), sent as HTTP Basic
// auth with a blank password. Until FUB_SYSTEM_KEY is set it shows as
// "coming soon".

const BASE_URL = "https://api.followupboss.com/v1";

export const followUpBossConfigured = () => Boolean(process.env.FUB_SYSTEM_KEY);

type Fetch = typeof fetch;

function headers(apiKey: string): Record<string, string> {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
    "X-System": process.env.FUB_SYSTEM || "OpenHomeHero",
    "X-System-Key": process.env.FUB_SYSTEM_KEY ?? "",
  };
}

async function call(apiKey: string, path: string, init: { method: string; body?: unknown }, fetchImpl: Fetch = fetch) {
  let res: Response;
  try {
    res = await fetchImpl(`${BASE_URL}${path}`, {
      method: init.method,
      headers: headers(apiKey),
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new CrmSendError(`Couldn't reach Follow Up Boss: ${(error as Error).message}`, true);
  }
  if (res.ok) {
    const text = await res.text();
    return { status: res.status, data: text ? (JSON.parse(text) as Record<string, unknown>) : null };
  }
  const detail = (await res.text().catch(() => "")).slice(0, 300);
  if (res.status === 401 || res.status === 403) {
    throw new CrmSendError(`Follow Up Boss refused access (${res.status}). ${detail}`.trim(), false, true);
  }
  if (res.status === 429 || res.status >= 500) {
    throw new CrmSendError(`Follow Up Boss is busy or down (${res.status}).`, true);
  }
  throw new CrmSendError(`Follow Up Boss rejected the record (${res.status}). ${detail}`.trim(), false);
}

function splitName(full: string): { firstName: string; lastName?: string } {
  const parts = full.trim().split(/\s+/);
  const firstName = parts.shift() ?? full;
  return parts.length ? { firstName, lastName: parts.join(" ") } : { firstName };
}

/** Sends one visitor as a Follow Up Boss event. Returns the person's id, if given. */
export async function sendToFollowUpBoss(apiKey: string, record: CrmRecord, fetchImpl?: Fetch): Promise<string | null> {
  const { data } = await call(
    apiKey,
    "/events",
    {
      method: "POST",
      body: {
        source: "Open Home Hero",
        system: process.env.FUB_SYSTEM || "OpenHomeHero",
        // Feedback = they came to the open home; an offer = a property inquiry.
        type: record.kind === "offer" ? "Property Inquiry" : "Visited Open House",
        message: record.subject,
        description: record.body,
        occurredAt: record.createdAt,
        person: {
          ...splitName(record.fullName),
          ...(record.email ? { emails: [{ value: record.email }] } : {}),
          ...(record.phone ? { phones: [{ value: record.phone }] } : {}),
          tags: ["Open Home Hero", record.kind === "offer" ? "Offer" : "Open home feedback"],
        },
        property: { street: record.listingAddress },
      },
    },
    fetchImpl,
  );
  // 204 = the agent archived this lead source in Follow Up Boss: accepted, ignored.
  const person = data?.person as { id?: number | string } | undefined;
  const id = person?.id ?? data?.id;
  return id !== undefined ? String(id) : null;
}

/** Cheap read to check an API key works before saving it. */
export async function testFollowUpBoss(apiKey: string, fetchImpl?: Fetch): Promise<void> {
  await call(apiKey, "/people?limit=1", { method: "GET" }, fetchImpl);
}
