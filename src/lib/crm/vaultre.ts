import type { CrmRecord } from "./record";
import { CrmSendError } from "./errors";

export { CrmSendError };

// VaultRE (MRI Software). Built from VaultRE's published API docs:
//   https://docs.api.vaultre.com.au/guide.html    (base URL, headers, limits)
//   https://docs.api.vaultre.com.au/samples.html  (POST /enquiries)
//   https://docs.api.vaultre.com.au/oauth.html    (Connect button flow)
//
// Every request needs OUR integrator API key (VAULTRE_API_KEY, issued when
// Open Home Hero is approved as a VaultRE integrator) plus the agency's own
// access token. Until VAULTRE_API_KEY is set, VaultRE shows as "coming soon".
//
// Visitors are sent as VaultRE *enquiries*: VaultRE's own lead inbox, which is
// what agency websites use. `originalId` lets VaultRE recognise a repeat.

const BASE_URL = "https://ap-southeast-2.api.vaultre.com.au/api/v1.3";
const OAUTH_AUTHORIZE = "https://login.vaultre.com.au/cgi-bin/clientvault/oauth-authorize.cgi";
const OAUTH_EXCHANGE = "https://login.vaultre.com.au/cgi-bin/clientvault/integrations/oauthexchange.cgi";

export const vaultreConfigured = () => Boolean(process.env.VAULTRE_API_KEY);
export const vaultreOauthConfigured = () => vaultreConfigured() && Boolean(process.env.VAULTRE_CLIENT_ID);

/** Which enquiry source to use. To be confirmed with VaultRE on approval. */
const enquirySource = () => process.env.VAULTRE_ENQUIRY_SOURCE || "OFFICEWEBSITE";


type Fetch = typeof fetch;

async function call(
  token: string,
  path: string,
  init: { method: string; body?: unknown },
  fetchImpl: Fetch = fetch,
): Promise<unknown> {
  let res: Response;
  try {
    res = await fetchImpl(`${BASE_URL}${path}`, {
      method: init.method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Api-Key": process.env.VAULTRE_API_KEY ?? "",
        Authorization: `Bearer ${token}`,
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new CrmSendError(`Couldn't reach VaultRE: ${(error as Error).message}`, true);
  }
  if (res.ok) {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  const detail = (await res.text().catch(() => "")).slice(0, 300);
  if (res.status === 401 || res.status === 403) {
    throw new CrmSendError(`VaultRE refused access (${res.status}). ${detail}`.trim(), false, true);
  }
  if (res.status === 429 || res.status >= 500) {
    throw new CrmSendError(`VaultRE is busy or down (${res.status}).`, true);
  }
  throw new CrmSendError(`VaultRE rejected the record (${res.status}). ${detail}`.trim(), false);
}

/** Sends one visitor as a VaultRE enquiry. Returns VaultRE's id for it, if given. */
export async function sendToVaultre(token: string, record: CrmRecord, fetchImpl?: Fetch): Promise<string | null> {
  const result = (await call(
    token,
    "/enquiries",
    {
      method: "POST",
      body: {
        enquiryDate: record.createdAt,
        subject: record.subject,
        body: record.body,
        originalId: record.originalId,
        source: enquirySource(),
        fullName: record.fullName,
        email: record.email ?? undefined,
        mobile: record.phone ?? undefined,
      },
    },
    fetchImpl,
  )) as { id?: number | string } | null;
  return result?.id !== undefined ? String(result.id) : null;
}

/** Cheap read to check a token works before saving it. */
export async function testVaultre(token: string, fetchImpl?: Fetch): Promise<void> {
  await call(token, "/contacts?pagesize=1", { method: "GET" }, fetchImpl);
}

/** Where to send the agency's VaultRE admin to approve the connection. */
export function vaultreAuthorizeUrl(redirectUri: string, state: string): string {
  const url = new URL(OAUTH_AUTHORIZE);
  url.searchParams.set("client_id", process.env.VAULTRE_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  return url.toString();
}

/** Swaps the one-minute code from the Connect flow for the agency's token. */
export async function exchangeVaultreCode(code: string, fetchImpl: Fetch = fetch): Promise<string> {
  const res = await fetchImpl(OAUTH_EXCHANGE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.VAULTRE_CLIENT_ID ?? "", code }).toString(),
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => null)) as { token?: string; message?: string } | null;
  if (!res.ok || !data?.token) {
    throw new Error(data?.message || `VaultRE didn't issue a token (${res.status}).`);
  }
  return data.token;
}
