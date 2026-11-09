import type { CrmRecord } from "./record";
import { CrmSendError } from "./errors";
import { crmRequest, noteHtml, type Fetch } from "./http";

// Pipedrive. The agent copies their personal API token (profile menu →
// Personal preferences → API) and pastes it. Sent as the x-api-token header.
//   - Persons use the v2 API: search by email (or phone) first so repeat
//     visitors aren't duplicated, otherwise POST /api/v2/persons.
//   - Notes use POST /api/v1/notes with person_id (HTML content).
//   - GET /api/v1/users/me checks the token.

const BASE_URL = "https://api.pipedrive.com";

const headers = (token: string) => ({ "x-api-token": token });

async function findPerson(token: string, field: "email" | "phone", term: string, fetchImpl?: Fetch) {
  const q = new URLSearchParams({ term, fields: field, exact_match: "true", limit: "1" });
  const res = await crmRequest("Pipedrive", `${BASE_URL}/api/v2/persons/search?${q}`, { method: "GET", headers: headers(token) }, fetchImpl);
  const items = (res.json?.data as { items?: { item?: { id?: number } }[] } | undefined)?.items;
  const id = items?.[0]?.item?.id;
  return id !== undefined ? String(id) : null;
}

async function findOrCreatePerson(token: string, record: CrmRecord, fetchImpl?: Fetch): Promise<string> {
  const existing = record.email
    ? await findPerson(token, "email", record.email, fetchImpl)
    : record.phone
      ? await findPerson(token, "phone", record.phone, fetchImpl)
      : null;
  if (existing) return existing;

  const res = await crmRequest(
    "Pipedrive",
    `${BASE_URL}/api/v2/persons`,
    {
      method: "POST",
      headers: headers(token),
      body: {
        name: record.fullName,
        ...(record.email ? { emails: [{ value: record.email, primary: true, label: "work" }] } : {}),
        ...(record.phone ? { phones: [{ value: record.phone, primary: true, label: "mobile" }] } : {}),
      },
    },
    fetchImpl,
  );
  const id = (res.json?.data as { id?: number } | undefined)?.id;
  if (id === undefined) throw new CrmSendError("Pipedrive created the person but gave no id.", false);
  return String(id);
}

/** Sends one visitor to Pipedrive: the person, plus a note with their feedback or offer. Returns the person id. */
export async function sendToPipedrive(token: string, record: CrmRecord, fetchImpl?: Fetch): Promise<string | null> {
  const personId = await findOrCreatePerson(token, record, fetchImpl);
  await crmRequest(
    "Pipedrive",
    `${BASE_URL}/api/v1/notes`,
    {
      method: "POST",
      headers: headers(token),
      body: { content: noteHtml(record.subject, record.body), person_id: Number(personId) },
    },
    fetchImpl,
  );
  return personId;
}

/** Cheap read to check a token works before saving it. */
export async function testPipedrive(token: string, fetchImpl?: Fetch): Promise<void> {
  await crmRequest("Pipedrive", `${BASE_URL}/api/v1/users/me`, { method: "GET", headers: headers(token) }, fetchImpl);
}
