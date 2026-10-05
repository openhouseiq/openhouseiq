import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { stripe } from "@/lib/stripe";

// Referrers earn 10% of each payment a referred account makes during its
// first 12 months of paying, credited against the referrer's own bills.
export const REFERRAL_RATE = 0.1;
export const REFERRAL_MONTHS = 12;
export const REFERRAL_COOKIE = "cp_ref";
export const REFERRAL_COOKIE_DAYS = 60;
// Only brand-new accounts can be attributed, so an old customer can't be
// assigned to someone after the fact.
const REFERRAL_MAX_ACCOUNT_AGE_DAYS = 30;

// Cash payouts are sent monthly once at least this much is owed.
export const PAYOUT_MINIMUM_CENTS = 5000;

// No 0/O or 1/I/L, so codes are easy to read out and type.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export function isValidReferralCode(code: string): boolean {
  return /^[A-Z0-9]{6,12}$/.test(code);
}

export function readReferralCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === REFERRAL_COOKIE) {
      const value = decodeURIComponent(rest.join("=")).toUpperCase();
      return isValidReferralCode(value) ? value : null;
    }
  }
  return null;
}

export async function getOrCreateReferralCode(
  service: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data: existing } = await service
    .from("referral_codes")
    .select("code")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing?.code) return existing.code as string;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { error } = await service.from("referral_codes").insert({ user_id: userId, code });
    if (!error) return code;
    // A concurrent request may have created it first.
    const { data: again } = await service
      .from("referral_codes")
      .select("code")
      .eq("user_id", userId)
      .maybeSingle();
    if (again?.code) return again.code as string;
  }
  throw new Error("Could not create a referral code.");
}

// Records who referred this user, using the referral cookie set by /r/CODE.
// Safe to call repeatedly: a user can only ever have one referrer, and the
// first attribution wins.
export async function attributeReferral(
  service: SupabaseClient,
  user: { id: string; created_at: string },
  cookieHeader: string | null,
): Promise<void> {
  const code = readReferralCookie(cookieHeader);
  if (!code) return;

  const accountAgeDays = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (accountAgeDays > REFERRAL_MAX_ACCOUNT_AGE_DAYS) return;

  const { data: owner } = await service
    .from("referral_codes")
    .select("user_id")
    .eq("code", code)
    .maybeSingle();
  if (!owner || owner.user_id === user.id) return;

  await service
    .from("referrals")
    .upsert(
      { referrer_user_id: owner.user_id, referred_user_id: user.id, code },
      { onConflict: "referred_user_id", ignoreDuplicates: true },
    );
}

// A referrer can receive bill credit once they have a Stripe billing account,
// either their own subscription or the agency they own.
async function findReferrerBilling(
  service: SupabaseClient,
  userId: string,
): Promise<{ customerId: string; subscriptionId: string | null } | null> {
  const { data: sub } = await service
    .from("subscriptions")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (sub?.stripe_customer_id) {
    return {
      customerId: sub.stripe_customer_id as string,
      subscriptionId: (sub.stripe_subscription_id as string | null) ?? null,
    };
  }

  const { data: agency } = await service
    .from("agencies")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (agency?.stripe_customer_id) {
    return {
      customerId: agency.stripe_customer_id as string,
      subscriptionId: (agency.stripe_subscription_id as string | null) ?? null,
    };
  }
  return null;
}

// How much more credit is useful to this referrer: their next bill minus the
// credit they already have waiting. Anything beyond that is paid as cash.
async function creditRoom(
  billing: { customerId: string; subscriptionId: string | null },
  currency: string,
): Promise<number> {
  // No live subscription means no upcoming bill for credit to reduce.
  if (!billing.subscriptionId) return 0;

  const customer = await stripe.customers.retrieve(billing.customerId);
  if (customer.deleted) return 0;
  const creditAvailable = Math.max(0, -(customer.balance ?? 0));

  let nextBill = 0;
  try {
    const preview = await stripe.invoices.createPreview({
      customer: billing.customerId,
      subscription: billing.subscriptionId,
    });
    if (preview.currency === currency) nextBill = preview.total;
  } catch {
    // Subscription cancelled or otherwise has no upcoming bill.
    nextBill = 0;
  }
  return Math.max(0, nextBill - creditAvailable);
}

type CreditRow = {
  id: string;
  referrer_user_id: string;
  credit_cents: number;
  currency: string;
  stripe_invoice_id: string;
  balance_cents: number;
  cash_cents: number;
  applied_at: string | null;
};

const CREDIT_COLUMNS =
  "id, referrer_user_id, credit_cents, currency, stripe_invoice_id, balance_cents, cash_cents, applied_at";

// Splits a referral bonus into bill credit (up to what the referrer's next
// bill can use) and cash (the rest), then adds the credit part to their Stripe
// balance. Safe to retry: the split is saved first and Stripe calls are
// idempotent.
async function allocateAndApply(service: SupabaseClient, credit: CreditRow): Promise<void> {
  if (credit.applied_at) return;

  const billing = await findReferrerBilling(service, credit.referrer_user_id);
  const customerId = billing?.customerId ?? null;

  let balancePortion = credit.balance_cents;
  if (credit.balance_cents + credit.cash_cents === 0) {
    const room = billing ? await creditRoom(billing, credit.currency).catch(() => 0) : 0;
    balancePortion = Math.min(credit.credit_cents, room);
    await service
      .from("referral_credits")
      .update({ balance_cents: balancePortion, cash_cents: credit.credit_cents - balancePortion })
      .eq("id", credit.id);
  }

  if (balancePortion > 0) {
    if (!customerId) return;
    try {
      // A negative balance transaction is a credit against future invoices.
      await stripe.customers.createBalanceTransaction(
        customerId,
        {
          amount: -balancePortion,
          currency: credit.currency,
          description: "CueProperty referral credit",
          metadata: { referral_credit_id: credit.id, invoice: credit.stripe_invoice_id },
        },
        { idempotencyKey: `referral-credit-${credit.id}` },
      );
    } catch (error) {
      console.error("Could not apply referral credit:", error);
      return;
    }
  }

  await service
    .from("referral_credits")
    .update({ applied_at: new Date().toISOString() })
    .eq("id", credit.id);
}

// Called for every paid Stripe invoice. Works out whether it belongs to a
// referred account and, if so, rewards the referrer.
export async function processReferralInvoice(
  service: SupabaseClient,
  invoice: Stripe.Invoice,
): Promise<void> {
  const amountPaid = invoice.amount_paid ?? 0;
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (amountPaid <= 0 || !customerId || !invoice.id) return;

  // Whose invoice is this? Either an individual subscriber or an agency owner.
  let referredUserId: string | null = null;
  const { data: sub } = await service
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  referredUserId = (sub?.user_id as string | undefined) ?? null;
  if (!referredUserId) {
    const { data: agency } = await service
      .from("agencies")
      .select("owner_user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    referredUserId = (agency?.owner_user_id as string | undefined) ?? null;
  }
  if (!referredUserId) return;

  const { data: referral } = await service
    .from("referrals")
    .select("id, referrer_user_id, first_paid_at")
    .eq("referred_user_id", referredUserId)
    .maybeSingle();
  if (!referral) return;

  const paidAt = new Date((invoice.created ?? Math.floor(Date.now() / 1000)) * 1000);

  let firstPaidAt = referral.first_paid_at ? new Date(referral.first_paid_at as string) : null;
  if (!firstPaidAt) {
    firstPaidAt = paidAt;
    await service
      .from("referrals")
      .update({ first_paid_at: paidAt.toISOString() })
      .eq("id", referral.id);
  }

  const windowEnd = new Date(firstPaidAt);
  windowEnd.setMonth(windowEnd.getMonth() + REFERRAL_MONTHS);
  if (paidAt > windowEnd) return;

  const creditCents = Math.floor(amountPaid * REFERRAL_RATE);
  if (creditCents <= 0) return;

  // The unique invoice id means a repeated event can never pay out twice.
  const { data: inserted, error } = await service
    .from("referral_credits")
    .insert({
      referral_id: referral.id,
      referrer_user_id: referral.referrer_user_id,
      stripe_invoice_id: invoice.id,
      invoice_amount_cents: amountPaid,
      credit_cents: creditCents,
      currency: invoice.currency,
    })
    .select(CREDIT_COLUMNS)
    .single();
  if (error || !inserted) return;

  await allocateAndApply(service, inserted as CreditRow);
}

// Finishes any bonus that couldn't be applied earlier (for example after a
// temporary Stripe error). Run when a referrer's billing account changes.
export async function applyPendingReferralCredits(
  service: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data: pending } = await service
    .from("referral_credits")
    .select(CREDIT_COLUMNS)
    .eq("referrer_user_id", userId)
    .is("applied_at", null);
  for (const row of (pending ?? []) as CreditRow[]) {
    await allocateAndApply(service, row);
  }
}

// ---------------------------------------------------------------------------
// Cash payouts via Stripe Connect

export async function getPayoutStatus(
  service: SupabaseClient,
  userId: string,
): Promise<{ hasAccount: boolean; ready: boolean }> {
  const { data } = await service
    .from("referral_payout_accounts")
    .select("stripe_account_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return { hasAccount: false, ready: false };
  return { hasAccount: true, ready: await isAccountReady(data.stripe_account_id as string) };
}

async function isAccountReady(accountId: string): Promise<boolean> {
  try {
    const account = await stripe.v2.core.accounts.retrieve(accountId, {
      include: ["configuration.recipient"],
    });
    return (
      account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status ===
      "active"
    );
  } catch {
    return false;
  }
}

// Returns a Stripe-hosted link where the referrer adds their identity and
// bank details. Creates their Connect account the first time.
export async function createPayoutOnboardingLink(
  service: SupabaseClient,
  user: { id: string; email?: string | null },
  origin: string,
): Promise<string> {
  const { data: existing } = await service
    .from("referral_payout_accounts")
    .select("stripe_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let accountId = existing?.stripe_account_id as string | undefined;
  if (!accountId) {
    const account = await stripe.v2.core.accounts.create({
      contact_email: user.email ?? undefined,
      display_name: user.email ?? undefined,
      dashboard: "express",
      identity: { country: "au" },
      defaults: {
        responsibilities: { fees_collector: "application", losses_collector: "application" },
      },
      configuration: {
        recipient: {
          capabilities: { stripe_balance: { stripe_transfers: { requested: true } } },
        },
      },
      metadata: { supabase_user_id: user.id },
    });
    accountId = account.id;
    await service
      .from("referral_payout_accounts")
      .insert({ user_id: user.id, stripe_account_id: accountId });
  }

  const link = await stripe.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        configurations: ["recipient"],
        refresh_url: `${origin}/dashboard/referrals?payouts=refresh`,
        return_url: `${origin}/dashboard/referrals?payouts=return`,
      },
    },
  });
  return link.url;
}

export type PayoutResult = {
  userId: string;
  owedCents: number;
  status: "paid" | "would_pay" | "below_minimum" | "no_payout_account" | "account_not_ready" | "failed";
  error?: string;
};

// Pays every referrer who is owed at least the minimum and has finished
// payout setup. With dryRun it only reports what it would do.
export async function runReferralPayouts(
  service: SupabaseClient,
  { dryRun }: { dryRun: boolean },
): Promise<PayoutResult[]> {
  const { data: rows } = await service
    .from("referral_credits")
    .select("id, referrer_user_id, cash_cents, currency")
    .gt("cash_cents", 0)
    .is("payout_id", null);

  const groups = new Map<string, { userId: string; currency: string; ids: string[]; total: number }>();
  for (const row of rows ?? []) {
    const key = `${row.referrer_user_id}:${row.currency}`;
    const group = groups.get(key) ?? {
      userId: row.referrer_user_id as string,
      currency: row.currency as string,
      ids: [],
      total: 0,
    };
    group.ids.push(row.id as string);
    group.total += row.cash_cents as number;
    groups.set(key, group);
  }

  const results: PayoutResult[] = [];

  for (const group of groups.values()) {
    const base = { userId: group.userId, owedCents: group.total };

    if (group.total < PAYOUT_MINIMUM_CENTS) {
      results.push({ ...base, status: "below_minimum" });
      continue;
    }

    const { data: account } = await service
      .from("referral_payout_accounts")
      .select("stripe_account_id")
      .eq("user_id", group.userId)
      .maybeSingle();
    if (!account) {
      results.push({ ...base, status: "no_payout_account" });
      continue;
    }
    if (!(await isAccountReady(account.stripe_account_id as string))) {
      results.push({ ...base, status: "account_not_ready" });
      continue;
    }
    if (dryRun) {
      results.push({ ...base, status: "would_pay" });
      continue;
    }

    const { data: payout, error: payoutError } = await service
      .from("referral_payouts")
      .insert({ user_id: group.userId, amount_cents: group.total, currency: group.currency })
      .select("id")
      .single();
    if (payoutError || !payout) {
      results.push({ ...base, status: "failed", error: payoutError?.message });
      continue;
    }

    // Claim the credits so a second run can't pay them again.
    const { data: claimed } = await service
      .from("referral_credits")
      .update({ payout_id: payout.id })
      .in("id", group.ids)
      .is("payout_id", null)
      .select("id, cash_cents");
    const claimedTotal = (claimed ?? []).reduce((sum, r) => sum + (r.cash_cents as number), 0);

    try {
      if (claimedTotal < PAYOUT_MINIMUM_CENTS) throw new Error("Credits were already claimed.");
      const transfer = await stripe.transfers.create(
        {
          amount: claimedTotal,
          currency: group.currency,
          destination: account.stripe_account_id as string,
          description: "CueProperty referral payout",
          metadata: { payout_id: payout.id as string, supabase_user_id: group.userId },
        },
        { idempotencyKey: `referral-payout-${payout.id}` },
      );
      await service
        .from("referral_payouts")
        .update({ status: "paid", amount_cents: claimedTotal, stripe_transfer_id: transfer.id })
        .eq("id", payout.id);
      results.push({ ...base, owedCents: claimedTotal, status: "paid" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transfer failed.";
      await service
        .from("referral_payouts")
        .update({ status: "failed", error: message })
        .eq("id", payout.id);
      await service.from("referral_credits").update({ payout_id: null }).eq("payout_id", payout.id);
      results.push({ ...base, status: "failed", error: message });
    }
  }

  return results;
}
