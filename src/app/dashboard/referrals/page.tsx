import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { createServiceClient } from "@/lib/supabase/service";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import {
  getOrCreateReferralCode,
  getPayoutStatus,
  PAYOUT_MINIMUM_CENTS,
  REFERRAL_MONTHS,
  REFERRAL_RATE,
} from "@/lib/referrals";
import { CopyLinkButton } from "./CopyLinkButton";
import { PayoutSetupButton } from "./PayoutSetupButton";

function money(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function shortName(fullName: string | undefined, email: string | undefined): string {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return email ? email.split("@")[0] : "An agent";
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export default async function ReferralsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const service = createServiceClient();
  const code = await getOrCreateReferralCode(service, user.id);

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const link = `${protocol}://${host}/r/${code}`;

  const [{ data: referrals }, { data: credits }, { data: payouts }, payoutStatus] = await Promise.all([
    service
      .from("referrals")
      .select("id, referred_user_id, first_paid_at, created_at")
      .eq("referrer_user_id", user.id)
      .order("created_at", { ascending: false }),
    service
      .from("referral_credits")
      .select("credit_cents, balance_cents, cash_cents, payout_id")
      .eq("referrer_user_id", user.id),
    service
      .from("referral_payouts")
      .select("amount_cents, status")
      .eq("user_id", user.id)
      .eq("status", "paid"),
    getPayoutStatus(service, user.id),
  ]);

  const people = await Promise.all(
    (referrals ?? []).map(async (referral) => {
      const { data } = await service.auth.admin.getUserById(referral.referred_user_id);
      return {
        id: referral.id as string,
        name: shortName(
          data.user?.user_metadata?.full_name as string | undefined,
          data.user?.email,
        ),
        joined: new Date(referral.created_at as string).toLocaleDateString("en-AU", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        paying: Boolean(referral.first_paid_at),
      };
    }),
  );

  const earned = (credits ?? []).reduce((sum, c) => sum + (c.credit_cents as number), 0);
  const toBills = (credits ?? []).reduce((sum, c) => sum + (c.balance_cents as number), 0);
  const cashOwed = (credits ?? [])
    .filter((c) => !c.payout_id)
    .reduce((sum, c) => sum + (c.cash_cents as number), 0);
  const paidOut = (payouts ?? []).reduce((sum, p) => sum + (p.amount_cents as number), 0);
  const fullName = (user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <div className="min-h-screen bg-paper">
      <DashboardHeader
        agentLabel={fullName || user.email || ""}
        backHref="/dashboard"
        backLabel="Back to dashboard"
      />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-serif text-2xl font-medium text-ink">Refer &amp; earn</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Share your link with other agents. When someone signs up through it and
          becomes a paying customer, you earn {Math.round(REFERRAL_RATE * 100)}% of
          everything they pay for their first {REFERRAL_MONTHS} months, taken off
          your own CueProperty bill.
        </p>

        <div className="mt-6 rounded-md border border-line bg-paper-card p-6">
          <p className="mb-2 text-sm font-medium text-ink">Your referral link</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="flex-1 break-all rounded-md border border-line bg-white px-3 py-2 font-mono text-sm text-ink">
              {link}
            </p>
            <CopyLinkButton link={link} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            ["Signed up", String(people.length)],
            ["Paying", String(people.filter((p) => p.paying).length)],
            ["Earned", money(earned)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-line bg-paper-card p-4">
              <p className="text-xs text-ink-soft">{label}</p>
              <p className="mt-1 font-serif text-xl text-ink">{value}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-ink-soft">
          {money(toBills)} taken off your bills · {money(cashOwed)} cash owed · {money(paidOut)}{" "}
          paid out
        </p>

        <div className="mt-6 rounded-md border border-line bg-paper-card p-6">
          <h2 className="mb-1 font-serif text-lg font-medium text-ink">Cash payouts</h2>
          <p className="mb-4 text-sm text-ink-soft">
            Your bonus first comes off your own bill. Once your bill is covered, or if
            you don&apos;t have one, the rest is paid into your bank account. Payouts
            are sent monthly once you&apos;re owed {money(PAYOUT_MINIMUM_CENTS)} or more.
          </p>
          {payoutStatus.ready ? (
            <p className="text-sm text-ink">Payouts are set up. You&apos;re all set.</p>
          ) : (
            <PayoutSetupButton
              label={payoutStatus.hasAccount ? "Finish payout setup" : "Set up payouts"}
            />
          )}
        </div>

        <div className="mt-6 rounded-md border border-line bg-paper-card p-6">
          <h2 className="mb-4 font-serif text-lg font-medium text-ink">People you&apos;ve referred</h2>
          {people.length === 0 ? (
            <p className="text-sm text-ink-soft">No one yet. Share your link to get started.</p>
          ) : (
            <ul className="space-y-2">
              {people.map((person) => (
                <li
                  key={person.id}
                  className="flex items-center justify-between rounded-md border border-line px-4 py-2.5"
                >
                  <div>
                    <p className="text-sm text-ink">{person.name}</p>
                    <p className="text-xs text-ink-soft">Joined {person.joined}</p>
                  </div>
                  <span className="text-xs text-ink-soft">
                    {person.paying ? "Paying" : "On trial"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-6 text-xs text-ink-soft">
          Credits are applied to your CueProperty bills and have no cash value. They
          only apply to people who sign up as new customers through your link, and you
          can&apos;t refer yourself.
        </p>
      </main>
    </div>
  );
}
