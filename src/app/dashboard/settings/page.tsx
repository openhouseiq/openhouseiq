import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AgentProfileForm } from "./AgentProfileForm";
import { PasswordSection } from "./PasswordSection";
import { TwoStepSection } from "./TwoStepSection";
import { BillingSection } from "./BillingSection";
import { AgencySection } from "./AgencySection";
import { FAQSection } from "./FAQSection";
import { ContactSection } from "../contact/ContactSection";
import { SettingsTabs, isSettingsTab, type SettingsTab } from "./SettingsTabs";
import { InstallAppSection } from "./InstallAppSection";
import { NotificationSettings } from "./NotificationSettings";
import { DeleteAccountSection } from "./DeleteAccountSection";
import {
  CrmSection,
  type CrmConnectionView,
  type CrmProviderView,
} from "./CrmSection";
import { createServiceClient } from "@/lib/supabase/service";
import { PROVIDERS, getConnection, type ProviderId } from "@/lib/crm";
import { crmManagerFor } from "@/lib/crm/owner";
import { crmEncryptionReady } from "@/lib/crm/crypto";
import type { Subscription, ContactMessage } from "@/lib/types";

export default async function SettingsPage(
  props: PageProps<"/dashboard/settings">,
) {
  const searchParams = await props.searchParams;
  const tab: SettingsTab = isSettingsTab(searchParams.tab)
    ? searchParams.tab
    : "profile";
  const crmNotice =
    typeof searchParams.crm === "string" ? searchParams.crm : null;
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";
  const phone = (user.user_metadata?.phone as string | undefined) ?? "";
  const photoUrl = (user.user_metadata?.photo_url as string | undefined) ?? "";
  const emailNotificationsEnabled =
    (user.user_metadata?.email_notifications_enabled as boolean | undefined) ??
    true;

  const [
    { data: subscription },
    { data: ownedAgency },
    { data: contactMessages },
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .returns<Subscription[]>()
      .maybeSingle(),
    supabase
      .from("agencies")
      .select("id, name")
      .eq("owner_user_id", user.id)
      .maybeSingle(),
    tab === "contact"
      ? supabase
          .from("contact_messages")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .returns<ContactMessage[]>()
      : Promise.resolve({ data: null as ContactMessage[] | null }),
  ]);

  let membership: { agencyName: string; isOwner: boolean } | null = null;

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
      const agencyRow = activeMembership.agencies as unknown as {
        name: string;
      } | null;
      membership = {
        agencyName: agencyRow?.name ?? "your agency",
        isOwner: false,
      };
    }
  }

  // CRM connection (VaultRE now; Rex and AgentBox once access is granted).
  const service = createServiceClient();
  const crmManager = await crmManagerFor(service, user.id);
  const encryptionReady = crmEncryptionReady();
  const crmProviders: CrmProviderView[] = (
    Object.keys(PROVIDERS) as ProviderId[]
  ).map((id) => ({
    id,
    name: PROVIDERS[id].name,
    available: encryptionReady && PROVIDERS[id].available(),
    oauth: PROVIDERS[id].oauth(),
  }));
  let crmConnection: CrmConnectionView = null;
  if (crmManager.canManage) {
    const row = await getConnection(service, crmManager.owner);
    if (row && row.status !== "disconnected") {
      crmConnection = {
        provider: row.provider,
        status: row.status,
        lastError: row.last_error,
        lastSentAt: row.last_sent_at,
      };
    }
  } else {
    const { data: agencyId } = await service.rpc("user_current_agency_id", {
      uid: user.id,
    });
    if (agencyId) {
      const row = await getConnection(service, {
        agencyId: agencyId as string,
      });
      if (row && row.status !== "disconnected") {
        crmConnection = {
          provider: row.provider,
          status: row.status,
          lastError: null,
          lastSentAt: row.last_sent_at,
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

        <SettingsTabs active={tab} />

        <div className="mt-6 space-y-4">
          {tab === "profile" ? (
            <>
              <section className="rounded-md border border-line bg-paper-card p-6">
                <h3 className="mb-4 font-serif text-lg font-medium text-ink">
                  Agent profile
                </h3>
                <AgentProfileForm
                  userId={user.id}
                  fullName={fullName}
                  phone={phone}
                  email={user.email ?? ""}
                  photoUrl={photoUrl}
                />
              </section>
              <section
                id="crm"
                className="scroll-mt-6 rounded-md border border-line bg-paper-card p-6"
              >
                <h3 className="mb-4 font-serif text-lg font-medium text-ink">
                  Connect your CRM
                </h3>
                <CrmSection
                  providers={crmProviders}
                  connection={crmConnection}
                  canManage={crmManager.canManage}
                  manageNote={crmManager.canManage ? null : crmManager.reason}
                  scopeLabel={
                    crmManager.canManage
                      ? crmManager.scope === "agency"
                        ? `This connects ${crmManager.agencyName ?? "your agency"}: every agency listing will use it.`
                        : ""
                      : `${crmManager.agencyName} manages this for all its listings.`
                  }
                  notice={crmNotice}
                />
              </section>
              <section className="rounded-md border border-line bg-paper-card p-6">
                <h3 className="mb-4 font-serif text-lg font-medium text-ink">
                  Password
                </h3>
                <PasswordSection />
              </section>
              <section className="rounded-md border border-line bg-paper-card p-6">
                <h3 className="mb-4 font-serif text-lg font-medium text-ink">
                  Two-step login (2FA)
                </h3>
                <TwoStepSection />
              </section>
              <section className="rounded-md border border-line bg-paper-card p-6">
                <h3 className="mb-4 font-serif text-lg font-medium text-ink">
                  Install as an app
                </h3>
                <InstallAppSection />
              </section>
              <section className="rounded-md border border-line bg-paper-card p-6">
                <h3 className="mb-4 font-serif text-lg font-medium text-ink">
                  Notifications
                </h3>
                <NotificationSettings
                  userId={user.id}
                  initialEmailEnabled={emailNotificationsEnabled}
                />
              </section>
              <section className="rounded-md border border-error/30 bg-paper-card p-6">
                <h3 className="mb-4 font-serif text-lg font-medium text-error">
                  Delete your account
                </h3>
                <DeleteAccountSection />
              </section>
            </>
          ) : null}

          {tab === "billing" ? (
            <>
              <section className="rounded-md border border-line bg-paper-card p-6">
                <h3 className="mb-4 font-serif text-lg font-medium text-ink">
                  Billing
                </h3>
                <BillingSection
                  subscription={subscription}
                  coveredByAgency={Boolean(membership)}
                />
              </section>
              <section className="rounded-md border border-line bg-paper-card p-6">
                <h3 className="mb-4 font-serif text-lg font-medium text-ink">
                  Agency set-up
                </h3>
                <AgencySection membership={membership} />
              </section>
            </>
          ) : null}

          {tab === "faq" ? (
            <>
              <section className="rounded-md border border-line bg-paper-card p-6">
                <FAQSection />
              </section>
            </>
          ) : null}

          {tab === "contact" ? (
            <section className="rounded-md border border-line bg-paper-card p-6">
              <p className="mb-4 text-sm text-ink-soft">
                Questions, ideas or something not working? Send us a message and
                we&apos;ll reply here.
              </p>
              <ContactSection initialMessages={contactMessages ?? []} />
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
