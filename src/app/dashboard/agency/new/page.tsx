import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { NewAgencyForm } from "./NewAgencyForm";

export default async function NewAgencyPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const service = createServiceClient();
  const { data: existingOwned } = await service
    .from("agencies")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (existingOwned) {
    redirect("/dashboard/agency");
  }

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader
        agentLabel={fullName || user.email || ""}
        backHref="/dashboard/settings"
        backLabel="Back to settings"
      />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-serif text-2xl font-medium text-ink">
          Set up an agency plan
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          One subscription for your whole agency. The more agents you add,
          the lower the per-agent price — automatically.
        </p>

        <NewAgencyForm />
      </main>
    </div>
  );
}
