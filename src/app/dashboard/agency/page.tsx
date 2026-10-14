import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AgencyDashboard } from "./AgencyDashboard";
import { inviteCutoffIso } from "@/lib/agencyInvites";
import type { Agency, AgencyMember } from "@/lib/types";

export default async function AgencyPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const { billing } = await searchParams;
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

  const { data: members } = agency && isOwner
    ? await service
        .from("agency_members")
        .select("*")
        .eq("agency_id", agency.id)
        .neq("status", "removed")
        .order("invited_at", { ascending: true })
        .returns<AgencyMember[]>()
    : { data: null };

  // Invitations that were never answered lapse after a while.
  const cutoff = inviteCutoffIso();
  const visibleMembers = (members ?? []).filter(
    (m) => m.status !== "invited" || m.invited_at >= cutoff,
  );

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader
        agentLabel={fullName || user.email || ""}
        backHref="/dashboard"
        backLabel="Back to dashboard"
      />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-serif text-2xl font-medium text-ink">
          {agency ? agency.name : "Set up an agency plan"}
        </h1>
        {!agency ? (
          <p className="mt-2 text-sm text-ink-soft">
            One subscription for your whole agency. Choose how many agents you
            need and see the price straight away — the bigger your team, the
            cheaper each agent is (5% off from 3 agents, 10% from 11, 15% from 16).
          </p>
        ) : null}

        <AgencyDashboard
          agency={agency}
          members={visibleMembers}
          isOwner={isOwner}
          justPaid={billing === "success"}
        />
      </main>
    </div>
  );
}
