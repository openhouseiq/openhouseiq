import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AgentProfileForm } from "./AgentProfileForm";
import { PasswordSection } from "./PasswordSection";
import { BillingSection } from "./BillingSection";
import type { Subscription } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";
  const phone = (user.user_metadata?.phone as string | undefined) ?? "";
  const photoUrl = (user.user_metadata?.photo_url as string | undefined) ?? "";

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .returns<Subscription[]>()
    .maybeSingle();

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
            <BillingSection subscription={subscription} />
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
        </div>
      </main>
    </div>
  );
}
