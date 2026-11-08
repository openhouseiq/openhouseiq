import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { siteOrigin } from "@/lib/siteUrl";
import { saveConnection, testToken } from "@/lib/crm";
import { crmManagerFor } from "@/lib/crm/owner";
import { secureEqual } from "@/lib/secureCompare";
import { exchangeVaultreCode } from "@/lib/crm/vaultre";

const STATE_COOKIE = "ohh_crm_state";

// VaultRE sends the admin back here after they approve (or cancel).
export async function GET(request: NextRequest) {
  const origin = siteOrigin(request);
  const back = (q: string) => {
    const res = NextResponse.redirect(`${origin}/dashboard/settings?${q}#crm`);
    res.cookies.set({ name: STATE_COOKIE, value: "", path: "/api/crm/vaultre", maxAge: 0 });
    return res;
  };

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);

  const params = request.nextUrl.searchParams;
  if (params.get("reason") !== "success") return back("crm=cancelled");
  if (!secureEqual(params.get("state"), request.cookies.get(STATE_COOKIE)?.value)) return back("crm=expired");
  const code = params.get("code");
  if (!code) return back("crm=error");

  const service = createServiceClient();
  const manager = await crmManagerFor(service, user.id);
  if (!manager.canManage) return back("crm=not-allowed");

  try {
    const token = await exchangeVaultreCode(code);
    await testToken("vaultre", token);
    await saveConnection(service, manager.owner, "vaultre", token, user.id);
  } catch (error) {
    console.error("VaultRE connect failed:", error);
    return back("crm=error");
  }
  return back("crm=connected");
}
