import type { CrmRecord } from "./record";
import { CrmSendError } from "./errors";
import { crmRequest, noteHtml, splitName, type Fetch } from "./http";

// HubSpot. The agency creates a private app (Settings → Integrations → Private Apps)
// with the scopes crm.objects.contacts.read and crm.objects.contacts.write, and
// pastes its access token. Built from HubSpot's CRM v3 docs:
//   - POST /crm/v3/objects/contacts creates a contact. If the email already
//     exists HubSpot answers 409 "Contact already exists. Existing ID: 123",
//     and we use that contact instead.
//   - POST /crm/v3/objects/notes with an association to the contact
//     (HUBSPOT_DEFINED type 202 = note to contact) adds the feedback/offer.

const BASE_URL = "https://api.hubapi.com";

const headers = (token: string) => ({ Authorization: `Bearer ${token}` });

async function findOrCreateContact(token: string, record: CrmRecord, fetchImpl?: Fetch): Promise<string> {
  const { firstName, lastName } = splitName(record.fullName);
  const properties: Record<string, string> = { firstname: firstName };
  if (lastName) properties.lastname = lastName;
  if (record.email) properties.email = record.email;
  if (record.phone) properties.phone = record.phone;

  const res = await crmRequest(
    "HubSpot",
    `${BASE_URL}/crm/v3/objects/contacts`,
    { method: "POST", headers: headers(token), body: { properties } },
    fetchImpl,
    [409],
  );
  if (res.status === 409) {
    const existing = res.text.match(/Existing ID:\s*(\d+)/)?.[1];
    if (existing) return existing;
    throw new CrmSendError(`HubSpot said the contact exists but gave no id. ${res.text.slice(0, 200)}`, false);
  }
  const id = res.json?.id;
  if (id === undefined || id === null) throw new CrmSendError("HubSpot created the contact but gave no id.", false);
  return String(id);
}

/** Sends one visitor to HubSpot: the contact, plus a note with their feedback or offer. Returns the contact id. */
export async function sendToHubSpot(token: string, record: CrmRecord, fetchImpl?: Fetch): Promise<string | null> {
  const contactId = await findOrCreateContact(token, record, fetchImpl);
  await crmRequest(
    "HubSpot",
    `${BASE_URL}/crm/v3/objects/notes`,
    {
      method: "POST",
      headers: headers(token),
      body: {
        properties: {
          hs_timestamp: record.createdAt,
          hs_note_body: noteHtml(record.subject, record.body),
        },
        associations: [
          {
            to: { id: contactId },
            types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }],
          },
        ],
      },
    },
    fetchImpl,
  );
  return contactId;
}

/** Cheap read to check a token works before saving it. */
export async function testHubSpot(token: string, fetchImpl?: Fetch): Promise<void> {
  await crmRequest("HubSpot", `${BASE_URL}/crm/v3/objects/contacts?limit=1`, { method: "GET", headers: headers(token) }, fetchImpl);
}
