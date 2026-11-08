import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectionOwner } from "./index";

export type CrmManager =
  | { canManage: true; owner: ConnectionOwner; scope: "agency" | "agent"; agencyName?: string }
  | { canManage: false; reason: string; agencyName: string };

/**
 * Who a user manages a CRM connection for. An agency owner connects the
 * agency's CRM (used for every agency listing). Agency members can't change
 * it. A solo agent connects their own.
 */
export async function crmManagerFor(service: SupabaseClient, userId: string): Promise<CrmManager> {
  const { data: owned } = await service
    .from("agencies")
    .select("id, name")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (owned) {
    return { canManage: true, owner: { agencyId: owned.id as string }, scope: "agency", agencyName: owned.name as string };
  }
  const { data: member } = await service
    .from("agency_members")
    .select("agency_id, agencies(name)")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (member) {
    const name = (member.agencies as unknown as { name: string } | null)?.name ?? "your agency";
    return { canManage: false, reason: "Your agency owner manages the CRM connection.", agencyName: name };
  }
  return { canManage: true, owner: { userId }, scope: "agent" };
}
