import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ContactSection } from "./ContactSection";
import type { ContactMessage } from "@/lib/types";

export const metadata = { title: "Contact us" };

export default async function ContactPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: contactMessages } = await supabase
    .from("contact_messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<ContactMessage[]>();

  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader
        agentLabel={fullName || user.email || ""}
        backHref="/dashboard"
        backLabel="Back to dashboard"
      />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-serif text-2xl font-medium text-ink">Contact us</h1>
        <p className="mt-2 text-sm text-[#3b4657]">
          Questions, ideas or something not working? Send us a message and we&apos;ll reply here.
        </p>
        <section className="mt-8 rounded-md border border-line bg-paper-card p-6">
          <ContactSection initialMessages={contactMessages ?? []} />
        </section>
      </main>
    </div>
  );
}
