import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/Button";
import { NewListingForm } from "./NewListingForm";

export default async function NewListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";

  const { data: hasAccess } = await supabase.rpc("has_active_access", {
    uid: user.id,
  });

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-paper">
        <DashboardHeader
          agentLabel={fullName || user.email || ""}
          backHref="/dashboard"
          backLabel="Back to dashboard"
        />
        <main className="mx-auto max-w-2xl px-6 py-12">
          <h1 className="font-serif text-2xl font-medium text-ink">New listing</h1>
          <div className="mt-6 rounded-md border border-line bg-paper-card p-6">
            <p className="text-sm text-ink">
              Your free trial has ended (or your subscription is inactive), so
              new listings are paused. Your existing listings, feedback, and
              offers are still fully available.
            </p>
            <Link href="/dashboard/settings" className="mt-4 inline-block">
              <Button variant="primary">Subscribe to continue</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader
        agentLabel={fullName || user.email || ""}
        backHref="/dashboard"
        backLabel="Back to dashboard"
      />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-serif text-2xl font-medium text-ink">New listing</h1>
        <NewListingForm />
      </main>
    </div>
  );
}
