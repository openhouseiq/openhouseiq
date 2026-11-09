import type { CrmRecord } from "./record";
import { CrmSendError } from "./errors";
import { crmRequest, splitName, type Fetch } from "./http";

// Lofty (formerly Chime), popular with US agents and teams. Built from the
// published docs (developer.lofty.com):
//   - API keys: the agent creates one in Lofty under Settings → Integrations → API,
//     sent as "Authorization: token <api_key>".
//   - POST /v1.0/leads creates a lead (firstName required) and returns { leadId }.
//   - X-Error-Status: true makes failures come back as real 4xx/5xx statuses
//     (otherwise many errors return HTTP 200 with an error body).
// No integrator approval is needed, so it's always available.

const BASE_URL = "https://api.lofty.com/v1.0";

const headers = (apiKey: string) => ({
  Authorization: `token ${apiKey}`,
  "X-Error-Status": "true",
});

/** Sends one visitor to Lofty as a lead. Returns the lead id. */
export async function sendToLofty(apiKey: string, record: CrmRecord, fetchImpl?: Fetch): Promise<string | null> {
  const { firstName, lastName } = splitName(record.fullName);
  const res = await crmRequest(
    "Lofty",
    `${BASE_URL}/leads`,
    {
      method: "POST",
      headers: headers(apiKey),
      body: {
        firstName: firstName.slice(0, 30),
        ...(lastName ? { lastName: lastName.slice(0, 30) } : {}),
        ...(record.email ? { emails: [record.email] } : {}),
        ...(record.phone ? { phones: [record.phone.slice(0, 20)] } : {}),
        source: "Open Home Hero",
        tagsAdd: ["Open Home Hero", record.kind === "offer" ? "Offer" : "Open home feedback"],
        leadTypes: [2], // Buyer
        content: `${record.subject}\n\n${record.body}`,
        property: { streetAddress: record.listingAddress },
      },
    },
    fetchImpl,
  );
  // Lofty ids can be too big for a JavaScript number, so read it from the raw text.
  const id = res.text.match(/"leadId"\s*:\s*"?(\d+)/)?.[1];
  if (!id && res.json && typeof res.json.errorCode !== "undefined") {
    throw new CrmSendError(`Lofty rejected the record. ${res.text.slice(0, 300)}`, false);
  }
  return id ?? null;
}

/** Cheap read to check an API key works before saving it. */
export async function testLofty(apiKey: string, fetchImpl?: Fetch): Promise<void> {
  await crmRequest("Lofty", `${BASE_URL}/leads?limit=1&offset=0`, { method: "GET", headers: headers(apiKey) }, fetchImpl);
}
