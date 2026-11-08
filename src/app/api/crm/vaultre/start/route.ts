import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { siteOrigin } from "@/lib/siteUrl";
import { crmManagerFor } from "@/lib/crm/owner";
import { crmEncryptionReady } from "@/lib/crm/crypto";
import { vaultreAuthorizeUrl, vaultreOauthConfigured } from "@/lib/crm/vaultre";

const STATE_COOKIE = "ohh_crm_state";

// "Connect to VaultRE" button: sends the agency's VaultRE admin to VaultRE to
// approve Open Home Hero, then VaultRE sends them back to /callback.
export async function GET(request: Request) {
  const origin = siteOrigin(request);
  const back = (q: string) => NextResponse.redirect(`${origin}/dashboard/settings?${q}#crm`);

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);
  if (!vaultreOauthConfigured() || !crmEncryptionReady()) return back("crm=unavailable");

  const manager = await crmManagerFor(createServiceClient(), user.id);
  if (!manager.canManage) return back("crm=not-allowed");

  const state = randomBytes(24).toString("base64url");
  const res = NextResponse.redirect(vaultreAuthorizeUrl(`${origin}/api/crm/vaultre/callback`, state));
  res.cookies.set({
    name: STATE_COOKIE,
    value: state,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/crm/vaultre",
    maxAge: 15 * 60,
  });
  return res;
}
