import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProfileForm } from "./ProfileForm";
import { EmailForm } from "./EmailForm";
import { PasswordForm } from "./PasswordForm";

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

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader
        agentLabel={fullName || user.email || ""}
        backHref="/dashboard"
        backLabel="Back to dashboard"
      />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-serif text-2xl font-medium text-ink">Settings</h1>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-medium text-ink-soft">Profile</h2>
          <ProfileForm fullName={fullName} phone={phone} />
        </section>

        <section className="mt-10 border-t border-line pt-8">
          <h2 className="mb-3 text-sm font-medium text-ink-soft">Email</h2>
          <EmailForm currentEmail={user.email ?? ""} />
        </section>

        <section className="mt-10 border-t border-line pt-8">
          <h2 className="mb-3 text-sm font-medium text-ink-soft">Password</h2>
          <PasswordForm />
        </section>
      </main>
    </div>
  );
}
