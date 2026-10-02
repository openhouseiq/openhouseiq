import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AgentProfileForm } from "./AgentProfileForm";
import { PasswordSection } from "./PasswordSection";
import { BillingSection } from "./BillingSection";
import { AgencySection } from "./AgencySection";
import { ContactSection } from "./ContactSection";
import { FAQSection } from "./FAQSection";
import { InstallAppSection } from "./InstallAppSection";
import { NotificationSettings } from "./NotificationSettings";
import { DeleteAccountSection } from "./DeleteAccountSection";
import type { Subscription, ContactMessage } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";
  const phone = (user.user_metadata?.phone as string | undefined) ?? "";
  const photoUrl = (user.user_metadata?.photo_url as string | undefined) ?? "";
  const emailNotificationsEnabled =
    (user.user_metadata?.email_notifications_enabled as boolean | undefined) ?? true;

  const [{ data: subscription }, { data: contactMessages }, { data: ownedAgency }] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .returns<Subscription[]>()
        .maybeSingle(),
      supabase
        .from("contact_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .returns<ContactMessage[]>(),
      supabase.from("agencies").select("id, name").eq("owner_user_id", user.id).maybeSingle(),
    ]);

  let membership: { agencyName: string; isOwner: boolean } | null = null;
  let pendingInvite: { agencyId: string; agencyName: string } | null = null;

  if (ownedAgency) {
    membership = { agencyName: ownedAgency.name, isOwner: true };
  } else {
    const { data: activeMembership } = await supabase
      .from("agency_members")
      .select("agency_id, agencies(name)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (activeMembership) {
      const agencyRow = activeMembership.agencies as unknown as { name: string } | null;
      membership = { agencyName: agencyRow?.name ?? "your agency", isOwner: false };
    } else if (user.email) {
      const { data: invite } = await supabase
        .from("agency_members")
        .select("agency_id, agencies(name)")
        .eq("email", user.email.toLowerCase())
        .eq("status", "invited")
        .maybeSingle();

      if (invite) {
        const agencyRow = invite.agencies as unknown as { name: string } | null;
        pendingInvite = {
          agencyId: invite.agency_id,
          agencyName: agencyRow?.name ?? "an agency",
        };
      }
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader
        agentLabel={fullName || user.email || ""}
        backHref="/dashboard"
        backLabel="Back to dashboard"
      />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-serif text-2xl font-medium text-ink">Settings</h1>

        <div className="mt-8 space-y-6">
          <section className="rounded-md border border-line bg-paper-card p-6">
            <h2 className="mb-4 font-serif text-lg font-medium text-ink">Billing</h2>
            <BillingSection subscription={subscription} coveredByAgency={Boolean(membership)} />
          </section>

          <section className="rounded-md border border-line bg-paper-card p-6">
            <h2 className="mb-4 font-serif text-lg font-medium text-ink">Agency</h2>
            <AgencySection membership={membership} pendingInvite={pendingInvite} />
          </section>

          <section className="rounded-md border border-line bg-paper-card p-6">
            <h2 className="mb-4 font-serif text-lg font-medium text-ink">
              Agent profile
            </h2>
            <AgentProfileForm
              userId={user.id}
              fullName={fullName}
              phone={phone}
              email={user.email ?? ""}
              photoUrl={photoUrl}
            />
          </section>

          <section className="rounded-md border border-line bg-paper-card p-6">
            <h2 className="mb-4 font-serif text-lg font-medium text-ink">Password</h2>
            <PasswordSection />
          </section>

          <section className="rounded-md border border-line bg-paper-card p-6">
            <h2 className="mb-4 font-serif text-lg font-medium text-ink">
              Install as an app
            </h2>
            <InstallAppSection />
          </section>

          <section className="rounded-md border border-line bg-paper-card p-6">
            <h2 className="mb-4 font-serif text-lg font-medium text-ink">
              Notifications
            </h2>
            <NotificationSettings
              userId={user.id}
              initialEmailEnabled={emailNotificationsEnabled}
            />
          </section>

          <section className="rounded-md border border-line bg-paper-card p-6">
            <h2 className="mb-4 font-serif text-lg font-medium text-ink">FAQ</h2>
            <FAQSection />
          </section>

          <section
            id="contact"
            className="scroll-mt-6 rounded-md border border-line bg-paper-card p-6"
          >
            <h2 className="mb-4 font-serif text-lg font-medium text-ink">Contact us</h2>
            <ContactSection initialMessages={contactMessages ?? []} />
          </section>

          <section className="rounded-md border border-error/30 bg-paper-card p-6">
            <h2 className="mb-4 font-serif text-lg font-medium text-error">
              Delete your account
            </h2>
            <DeleteAccountSection />
          </section>
        </div>
      </main>
    </div>
  );
}
