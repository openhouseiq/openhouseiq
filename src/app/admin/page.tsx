import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { AdminExportButton } from "./AdminExportButton";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-pine text-paper",
  trialing: "bg-brass text-paper",
  past_due: "bg-error/10 text-error",
  canceled: "bg-line text-ink-soft",
  none: "bg-line text-ink-soft",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  trialing: "Trialing",
  past_due: "Past due",
  canceled: "Canceled",
  incomplete: "Incomplete",
  incomplete_expired: "Incomplete (expired)",
  unpaid: "Unpaid",
  none: "No trial",
};

function isTrialStillActive(trialEndsAt: string | null): boolean {
  return Boolean(trialEndsAt && new Date(trialEndsAt).getTime() > Date.now());
}

export type AgentRow = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  status: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  listingsCount: number;
  feedbackCount: number;
  offersCount: number;
};

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const [{ data: usersData }, { data: subs }, { data: listings }, { data: feedbackRows }, { data: offerRows }] =
    await Promise.all([
      service.auth.admin.listUsers({ perPage: 1000 }),
      service.from("subscriptions").select("*"),
      service.from("listings").select("id, agent_id, created_at"),
      service.from("feedback").select("listing_id"),
      service.from("offers").select("listing_id"),
    ]);

  const users = usersData?.users ?? [];
  const listingRows = listings ?? [];
  const subscriptionRows = subs ?? [];

  const listingToAgent = new Map(listingRows.map((l) => [l.id, l.agent_id]));

  function countByAgent(rows: { listing_id: string }[]) {
    const map = new Map<string, number>();
    for (const row of rows) {
      const agentId = listingToAgent.get(row.listing_id);
      if (!agentId) continue;
      map.set(agentId, (map.get(agentId) ?? 0) + 1);
    }
    return map;
  }

  const listingsCountByAgent = new Map<string, number>();
  for (const l of listingRows) {
    listingsCountByAgent.set(l.agent_id, (listingsCountByAgent.get(l.agent_id) ?? 0) + 1);
  }
  const feedbackCountByAgent = countByAgent(feedbackRows ?? []);
  const offersCountByAgent = countByAgent(offerRows ?? []);
  const subsByUser = new Map(subscriptionRows.map((s) => [s.user_id, s]));

  const agentRows: AgentRow[] = users
    .map((u) => {
      const sub = subsByUser.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        fullName: (u.user_metadata?.full_name as string | undefined) ?? "",
        createdAt: u.created_at,
        status: sub?.status ?? "none",
        trialEndsAt: sub?.trial_ends_at ?? null,
        currentPeriodEnd: sub?.current_period_end ?? null,
        listingsCount: listingsCountByAgent.get(u.id) ?? 0,
        feedbackCount: feedbackCountByAgent.get(u.id) ?? 0,
        offersCount: offersCountByAgent.get(u.id) ?? 0,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activeCount = subscriptionRows.filter((s) => s.status === "active").length;
  const trialingCount = subscriptionRows.filter(
    (s) => s.status === "trialing" && isTrialStillActive(s.trial_ends_at),
  ).length;
  const pastDueCount = subscriptionRows.filter((s) => s.status === "past_due").length;
  const canceledCount = subscriptionRows.filter((s) => s.status === "canceled").length;

  const monthlyPriceId = process.env.STRIPE_PRICE_MONTHLY;
  const yearlyPriceId = process.env.STRIPE_PRICE_YEARLY;
  let mrr = 0;
  for (const s of subscriptionRows) {
    if (s.status !== "active") continue;
    if (s.price_id === monthlyPriceId) mrr += 29;
    else if (s.price_id === yearlyPriceId) mrr += 290 / 12;
  }

  const stats = [
    { label: "Total agents", value: users.length },
    { label: "Active subscriptions", value: activeCount },
    { label: "On trial", value: trialingCount },
    { label: "Past due", value: pastDueCount },
    { label: "Canceled", value: canceledCount },
    { label: "Est. MRR", value: `$${mrr.toFixed(0)}` },
    { label: "Total listings", value: listingRows.length },
    { label: "Total feedback", value: (feedbackRows ?? []).length },
    { label: "Total offers", value: (offerRows ?? []).length },
  ];

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-paper-card px-6 py-4">
        <span className="font-serif text-xl tracking-tight">
          <span className="text-ink">OpenHouse</span>
          <span className="text-brass">IQ</span>
          <span className="ml-2 text-sm font-sans font-normal text-ink-soft">Admin</span>
        </span>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-2xl font-medium text-ink">Admin dashboard</h1>
          <AdminExportButton rows={agentRows} />
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-md border border-line bg-paper-card p-4"
            >
              <p className="text-xs text-ink-soft">{stat.label}</p>
              <p className="mt-1 font-serif text-2xl font-medium text-ink">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 overflow-x-auto rounded-md border border-line bg-paper-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-ink-soft">
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Signed up</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Trial ends / Renews</th>
                <th className="px-4 py-3 font-medium">Listings</th>
                <th className="px-4 py-3 font-medium">Feedback</th>
                <th className="px-4 py-3 font-medium">Offers</th>
              </tr>
            </thead>
            <tbody>
              {agentRows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{row.fullName || "—"}</p>
                    <p className="text-xs text-ink-soft">{row.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[row.status] ?? "bg-line text-ink-soft"
                      }`}
                    >
                      {STATUS_LABELS[row.status] ?? row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {row.status === "trialing" && row.trialEndsAt
                      ? new Date(row.trialEndsAt).toLocaleDateString()
                      : row.status === "active" && row.currentPeriodEnd
                        ? new Date(row.currentPeriodEnd).toLocaleDateString()
                        : "—"}
                  </td>
                  <td className="px-4 py-3 text-ink">{row.listingsCount}</td>
                  <td className="px-4 py-3 text-ink">{row.feedbackCount}</td>
                  <td className="px-4 py-3 text-ink">{row.offersCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
