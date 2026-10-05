import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { PayoutRunner } from "./PayoutRunner";

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AdminReferralsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
    notFound();
  }

  const service = createServiceClient();
  const [{ data: credits }, { data: payouts }, { data: usersData }] = await Promise.all([
    service.from("referral_credits").select("referrer_user_id, credit_cents, balance_cents, cash_cents, payout_id"),
    service.from("referral_payouts").select("amount_cents, status").eq("status", "paid"),
    service.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emails: Record<string, string> = {};
  for (const u of usersData?.users ?? []) {
    if (u.email) emails[u.id] = u.email;
  }

  const totalEarned = (credits ?? []).reduce((s, c) => s + (c.credit_cents as number), 0);
  const totalToBills = (credits ?? []).reduce((s, c) => s + (c.balance_cents as number), 0);
  const cashOwed = (credits ?? [])
    .filter((c) => !c.payout_id)
    .reduce((s, c) => s + (c.cash_cents as number), 0);
  const paidOut = (payouts ?? []).reduce((s, p) => s + (p.amount_cents as number), 0);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-serif text-2xl font-medium text-ink">Referral payouts</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Bonuses earned", money(totalEarned)],
          ["Taken off bills", money(totalToBills)],
          ["Cash owed", money(cashOwed)],
          ["Paid out", money(paidOut)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-line bg-paper-card p-4">
            <p className="text-xs text-ink-soft">{label}</p>
            <p className="mt-1 font-serif text-xl text-ink">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-sm text-ink-soft">
        Payouts are sent through Stripe Connect to referrers who have finished payout setup
        and are owed $50 or more. Preview first to see who would be paid.
      </p>
      <div className="mt-4">
        <PayoutRunner emails={emails} />
      </div>
    </main>
  );
}
