import { createServiceClient } from "@/lib/supabase/service";
import type { CurrentUser } from "@/lib/supabase/current-user";

/** How long an invitation stays open before it has to be sent again. */
export const INVITE_DAYS = 14;

export type PendingInvite = { id: string; agencyName: string };

export function inviteCutoffIso(): string {
  return new Date(Date.now() - INVITE_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Open agency invitations addressed to this user's confirmed email. An
 * unconfirmed address never sees invitations, so nobody can claim an
 * invitation by registering someone else's email.
 */
export async function getPendingInvites(user: CurrentUser): Promise<PendingInvite[]> {
  if (!user.email || !user.emailConfirmed) return [];

  const { data } = await createServiceClient()
    .from("agency_members")
    .select("id, agencies(name)")
    .ilike("email", user.email)
    .eq("status", "invited")
    .gt("invited_at", inviteCutoffIso())
    .returns<{ id: string; agencies: { name: string } | { name: string }[] | null }[]>();

  return (data ?? []).map((row) => {
    const agency = Array.isArray(row.agencies) ? row.agencies[0] : row.agencies;
    return { id: row.id, agencyName: agency?.name ?? "an agency" };
  });
}
