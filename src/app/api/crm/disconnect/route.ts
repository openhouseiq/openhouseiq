import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { disconnect } from "@/lib/crm";
import { crmManagerFor } from "@/lib/crm/owner";

// Stops sending visitors to the CRM and deletes the stored token.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const service = createServiceClient();
  const manager = await crmManagerFor(service, user.id);
  if (!manager.canManage) return NextResponse.json({ error: manager.reason }, { status: 403 });
  await disconnect(service, manager.owner);
  return NextResponse.json({ success: true });
}
