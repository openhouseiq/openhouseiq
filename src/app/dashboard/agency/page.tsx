import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AgencyDashboard } from "./AgencyDashboard";
import type { Agency, AgencyMember } from "@/lib/types";

export default async function AgencyPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const service = createServiceClient();

  const { data: ownedAgency } = await service
    .from("agencies")
    .select("*")
    .eq("owner_user_id", user.id)
    .returns<Agency[]>()
    .maybeSingle();

  let agency = ownedAgency;
  let isOwner = Boolean(ownedAgency);

  if (!agency) {
    const { data: membership } = await service
      .from("agency_members")
      .select("agency_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (membership) {
      const { data: memberAgency } = await service
        .from("agencies")
        .select("*")
        .eq("id", membership.agency_id)
        .returns<Agency[]>()
        .maybeSingle();
      agency = memberAgency;
      isOwner = false;
    }
  }

  if (!agency) {
    redirect("/dashboard/agency/new");
  }

  const { data: members } = isOwner
    ? await service
        .from("agency_members")
        .select("*")
        .eq("agency_id", agency.id)
        .neq("status", "removed")
        .order("invited_at", { ascending: true })
        .returns<AgencyMember[]>()
    : { data: null };

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader
        agentLabel={fullName || user.email || ""}
        backHref="/dashboard"
        backLabel="Back to dashboard"
      />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-serif text-2xl font-medium text-ink">{agency.name}</h1>

        <AgencyDashboard agency={agency} members={members ?? []} isOwner={isOwner} />
      </main>
    </div>
  );
}
