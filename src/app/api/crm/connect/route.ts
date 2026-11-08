import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { PROVIDERS, isProviderId, saveConnection, testToken } from "@/lib/crm";
import { crmManagerFor } from "@/lib/crm/owner";
import { crmEncryptionReady } from "@/lib/crm/crypto";
import { CrmSendError } from "@/lib/crm/errors";

// Connect a CRM by pasting the access token the CRM gave the agency
// (VaultRE: Office Integrations → Third-Party Access → Create Token).
// The token is checked with the CRM first, then stored encrypted.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { provider?: unknown; token?: unknown };
  if (!isProviderId(body.provider)) {
    return NextResponse.json({ error: "Unknown CRM." }, { status: 400 });
  }
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (token.length < 10 || token.length > 4000) {
    return NextResponse.json({ error: "Paste the full access token from your CRM." }, { status: 400 });
  }
  const provider = PROVIDERS[body.provider];
  if (!provider.available() || !crmEncryptionReady()) {
    return NextResponse.json({ error: `${provider.name} isn't available yet.` }, { status: 400 });
  }

  const service = createServiceClient();
  const manager = await crmManagerFor(service, user.id);
  if (!manager.canManage) return NextResponse.json({ error: manager.reason }, { status: 403 });

  try {
    await testToken(body.provider, token);
  } catch (error) {
    const msg =
      error instanceof CrmSendError && error.authFailed
        ? `${provider.name} didn't accept that token. Check you copied all of it, and that it hasn't been deleted.`
        : `Couldn't check the token with ${provider.name}. Try again in a minute.`;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  await saveConnection(service, manager.owner, body.provider, token, user.id);
  return NextResponse.json({ success: true });
}
