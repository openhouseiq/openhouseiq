import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json();
  const memberId = String(body.memberId ?? "");

  const service = createServiceClient();

  const { data: member } = await service
    .from("agency_members")
    .select("id, agency_id, status, user_id")
    .eq("id", memberId)
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const { data: agency } = await service
    .from("agencies")
    .select("id, owner_user_id")
    .eq("id", member.agency_id)
    .maybeSingle();

  if (!agency || agency.owner_user_id !== user.id) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  if (member.user_id === agency.owner_user_id) {
    return NextResponse.json({ error: "The agency owner can't be removed." }, { status: 400 });
  }

  await service
    .from("agency_members")
    .update({ status: "removed", removed_at: new Date().toISOString() })
    .eq("id", memberId);

  return NextResponse.json({ success: true });
}
