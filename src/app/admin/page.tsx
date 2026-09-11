import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { stripe } from "@/lib/stripe";
import { MonthlyStatementExportButton } from "./MonthlyStatementExportButton";
import { ExtendTrialButton } from "./ExtendTrialButton";
import type { ProductFeedback } from "@/lib/types";

export type MonthlyStatement = {
  monthLabel: string;
  monthKey: string;
  newSignups: number;
  newSubscriptions: number;
  cancellations: number;
  revenue: number;
};

function monthBounds(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function getMonthlyStatement(
  monthKey: string,
  users: { created_at: string }[],
): Promise<MonthlyStatement> {
  const { start, end } = monthBounds(monthKey);
  const gte = Math.floor(start.getTime() / 1000);
  const lt = Math.floor(end.getTime() / 1000);

  const newSignups = users.filter((u) => {
    const t = new Date(u.created_at).getTime();
    return t >= start.getTime() && t < end.getTime();
  }).length;

  let newSubscriptions = 0;
  let cancellations = 0;
  let revenue = 0;

  try {
    const [startedSubs, canceledSubs, invoices] = await Promise.all([
      stripe.subscriptions.list({ created: { gte, lt }, limit: 100 }),
      stripe.subscriptions.list({ status: "canceled", limit: 100 }),
      stripe.invoices.list({ status: "paid", created: { gte, lt }, limit: 100 }),
    ]);

    newSubscriptions = startedSubs.data.length;
    cancellations = canceledSubs.data.filter(
      (s) => s.canceled_at && s.canceled_at >= gte && s.canceled_at < lt,
    ).length;
    revenue = invoices.data.reduce((sum, inv) => sum + inv.amount_paid, 0) / 100;
  } catch {
    // Stripe unreachable or misconfigured — show zeros rather than crash the page.
  }

  const monthLabel = start.toLocaleDateString("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return { monthLabel, monthKey, newSignups, newSubscriptions, cancellations, revenue };
}

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

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
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
  productFeedbackSubmittedAt: string | null;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
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

  const [
    { data: usersData },
    { data: subs },
    { data: listings },
    { data: feedbackRows },
    { data: offerRows },
    { data: productFeedbackRows },
  ] = await Promise.all([
    service.auth.admin.listUsers({ perPage: 1000 }),
    service.from("subscriptions").select("*"),
    service.from("listings").select("id, agent_id, created_at"),
    service.from("feedback").select("listing_id"),
    service.from("offers").select("listing_id"),
    service
      .from("product_feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<ProductFeedback[]>(),
  ]);

  const users = usersData?.users ?? [];
  const listingRows = listings ?? [];
  const subscriptionRows = subs ?? [];

  const monthKey = month && /^\d{4}-\d{2}$/.test(month) ? month : currentMonthKey();
  const statement = await getMonthlyStatement(monthKey, users);
  const prevMonthKey = shiftMonth(monthKey, -1);
  const nextMonthKey = shiftMonth(monthKey, 1);
  const isCurrentMonth = monthKey === currentMonthKey();

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
  const productFeedbackByUser = new Map(
    (productFeedbackRows ?? []).map((f) => [f.user_id, f]),
  );

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
        productFeedbackSubmittedAt: productFeedbackByUser.get(u.id)?.created_at ?? null,
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
    { label: "Pilot feedback received", value: (productFeedbackRows ?? []).length },
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
          <MonthlyStatementExportButton statement={statement} rows={agentRows} />
        </div>

        <section className="mt-8 rounded-md border border-line bg-paper-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-lg font-medium text-ink">
              Monthly statement — {statement.monthLabel}
            </h2>
            <div className="flex items-center gap-3 text-sm">
              <Link
                href={`/admin?month=${prevMonthKey}`}
                className="text-pine underline"
              >
                ← Previous
              </Link>
              {!isCurrentMonth ? (
                <Link href="/admin" className="text-pine underline">
                  Current month
                </Link>
              ) : null}
              <Link
                href={`/admin?month=${nextMonthKey}`}
                className="text-pine underline"
              >
                Next →
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-ink-soft">New signups</p>
              <p className="mt-1 font-serif text-2xl font-medium text-ink">
                {statement.newSignups}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-soft">New subscriptions</p>
              <p className="mt-1 font-serif text-2xl font-medium text-ink">
                {statement.newSubscriptions}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-soft">Cancellations</p>
              <p className="mt-1 font-serif text-2xl font-medium text-ink">
                {statement.cancellations}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-soft">Revenue collected</p>
              <p className="mt-1 font-serif text-2xl font-medium text-ink">
                ${statement.revenue.toFixed(0)}
              </p>
            </div>
          </div>
        </section>

        <h2 className="mt-10 font-serif text-lg font-medium text-ink">
          Current snapshot
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
                <th className="px-4 py-3 font-medium">Pilot feedback</th>
                <th className="px-4 py-3 font-medium">Pilot actions</th>
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
                  <td className="px-4 py-3">
                    {row.productFeedbackSubmittedAt ? (
                      <span className="rounded-full bg-pine px-2 py-0.5 text-xs font-medium text-paper">
                        {new Date(row.productFeedbackSubmittedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="rounded-full bg-line px-2 py-0.5 text-xs font-medium text-ink-soft">
                        Not yet
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ExtendTrialButton userId={row.id} email={row.email} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {productFeedbackRows && productFeedbackRows.length > 0 ? (
          <div className="mt-10">
            <h2 className="font-serif text-xl font-medium text-ink">
              Pilot feedback responses
            </h2>
            <div className="mt-4 space-y-4">
              {productFeedbackRows.map((f) => {
                const agent = agentRows.find((a) => a.id === f.user_id);
                return (
                  <div
                    key={f.id}
                    className="rounded-md border border-line bg-paper-card p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-ink">
                        {agent?.fullName || agent?.email || f.user_id}
                      </p>
                      <span className="text-brass">
                        {"★".repeat(f.overall_rating)}
                        {"☆".repeat(5 - f.overall_rating)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">
                      {new Date(f.created_at).toLocaleString()} ·{" "}
                      {f.would_recommend === true
                        ? "Would recommend"
                        : f.would_recommend === false
                          ? "Would not recommend yet"
                          : "No recommendation given"}
                    </p>
                    {f.liked_most ? (
                      <p className="mt-2 text-sm text-ink">
                        <span className="font-medium">Liked most:</span>{" "}
                        {f.liked_most}
                      </p>
                    ) : null}
                    {f.biggest_frustration ? (
                      <p className="mt-1 text-sm text-ink">
                        <span className="font-medium">Frustration:</span>{" "}
                        {f.biggest_frustration}
                      </p>
                    ) : null}
                    {f.additional_comments ? (
                      <p className="mt-1 text-sm text-ink">
                        <span className="font-medium">Other:</span>{" "}
                        {f.additional_comments}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
