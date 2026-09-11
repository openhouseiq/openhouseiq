import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProductFeedbackForm } from "./ProductFeedbackForm";
import type { ProductFeedback } from "@/lib/types";

export default async function ProductFeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: existing } = await supabase
    .from("product_feedback")
    .select("*")
    .eq("user_id", user.id)
    .returns<ProductFeedback[]>()
    .maybeSingle();

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader
        agentLabel={fullName || user.email || ""}
        backHref="/dashboard"
        backLabel="Back to dashboard"
      />

      <main className="mx-auto max-w-xl px-6 py-12">
        <h1 className="font-serif text-2xl font-medium text-ink">
          How&apos;s OpenHouseIQ working for you?
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          You&apos;re one of the first agents trying this out — your honest
          feedback directly shapes what we build next. Takes about 2 minutes.
        </p>

        <div className="mt-8">
          {existing ? (
            <div className="rounded-md border border-line bg-paper-card p-6">
              <p className="text-sm text-ink">
                Thanks — you submitted feedback on{" "}
                {new Date(existing.created_at).toLocaleDateString()}. We really
                appreciate it.
              </p>
            </div>
          ) : (
            <ProductFeedbackForm />
          )}
        </div>
      </main>
    </div>
  );
}
