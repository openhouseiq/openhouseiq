import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/Button";
import { BillingSection } from "../settings/BillingSection";
import type { Subscription } from "@/lib/types";

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";
  const firstName = fullName.split(" ")[0] || "there";

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .returns<Subscription[]>()
    .maybeSingle();

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader agentLabel={fullName || user.email || ""} />

      <main className="mx-auto max-w-xl px-6 py-16">
        <h1 className="font-serif text-2xl font-medium text-ink">
          Welcome, {firstName}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Your account is ready. Here&apos;s your trial status — you can
          subscribe now or any time before it ends.
        </p>

        <section className="mt-8 rounded-md border border-line bg-paper-card p-6">
          <BillingSection subscription={subscription} />
        </section>

        <div className="mt-8">
          <Link href="/dashboard">
            <Button variant="secondary">Continue to dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
