import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// A small in-memory stand-in for the Supabase tables the referral code uses.
// It supports just the query shapes referrals.ts calls, and enforces the same
// unique columns as supabase/0029_referrals.sql and 0030_referral_payouts.sql.

type Row = Record<string, unknown>;
const UNIQUE: Record<string, string[]> = {
  referral_codes: ["user_id", "code"],
  referrals: ["referred_user_id"],
  referral_credits: ["stripe_invoice_id"],
  referral_payout_accounts: ["user_id", "stripe_account_id"],
  referral_payouts: [],
  subscriptions: [],
  agencies: [],
};

// Column defaults from the SQL migrations.
const DEFAULTS: Record<string, Row> = {
  referral_credits: { balance_cents: 0, cash_cents: 0, payout_id: null, applied_at: null },
  referrals: { first_paid_at: null },
  referral_payouts: { status: "pending" },
};

let tables: Record<string, Row[]> = {};
let idSeq = 0;

function makeDb() {
  function from(table: string) {
    const rows = (tables[table] ??= []);
    const filters: ((r: Row) => boolean)[] = [];
    let op: "select" | "insert" | "update" | "upsert" = "select";
    let payload: Row | null = null;
    let upsertOpts: { onConflict?: string; ignoreDuplicates?: boolean } = {};
    let returning = false;

    const run = (): { data: Row[] | null; error: { message: string } | null } => {
      if (op === "insert" || op === "upsert") {
        const row: Row = {
          id: `id-${++idSeq}`,
          created_at: new Date().toISOString(),
          ...DEFAULTS[table],
          ...payload,
        };
        for (const col of UNIQUE[table] ?? []) {
          if (rows.some((r) => r[col] === row[col])) {
            if (op === "upsert" && upsertOpts.ignoreDuplicates && upsertOpts.onConflict === col) {
              return { data: [], error: null };
            }
            return { data: null, error: { message: `duplicate ${col}` } };
          }
        }
        rows.push(row);
        return { data: [row], error: null };
      }
      const matched = rows.filter((r) => filters.every((f) => f(r)));
      if (op === "update") {
        for (const r of matched) Object.assign(r, payload);
        return { data: returning ? matched : null, error: null };
      }
      return { data: matched, error: null };
    };

    const builder = {
      select() {
        if (op !== "select") returning = true;
        return builder;
      },
      insert(p: Row) {
        op = "insert";
        payload = p;
        return builder;
      },
      upsert(p: Row, opts: typeof upsertOpts) {
        op = "upsert";
        payload = p;
        upsertOpts = opts;
        return builder;
      },
      update(p: Row) {
        op = "update";
        payload = p;
        return builder;
      },
      eq(c: string, v: unknown) {
        filters.push((r) => r[c] === v);
        return builder;
      },
      is(c: string, v: unknown) {
        filters.push((r) => (r[c] ?? null) === v);
        return builder;
      },
      gt(c: string, v: number) {
        filters.push((r) => (r[c] as number) > v);
        return builder;
      },
      in(c: string, vs: unknown[]) {
        filters.push((r) => vs.includes(r[c]));
        return builder;
      },
      order() {
        return builder;
      },
      async maybeSingle() {
        const { data, error } = run();
        return { data: data?.[0] ?? null, error };
      },
      async single() {
        const { data, error } = run();
        return { data: data?.[0] ?? null, error: error ?? (data?.length ? null : { message: "no row" }) };
      },
      then(resolve: (v: unknown) => void, reject: (e: unknown) => void) {
        try {
          resolve(run());
        } catch (e) {
          reject(e);
        }
      },
    };
    return builder;
  }
  return { from } as never;
}

// ---------------------------------------------------------------------------
// Stripe is replaced with a fake so nothing real is charged or paid.

const stripeMock = vi.hoisted(() => ({
  customers: { retrieve: vi.fn(), createBalanceTransaction: vi.fn() },
  invoices: { createPreview: vi.fn() },
  transfers: { create: vi.fn() },
  v2: { core: { accounts: { retrieve: vi.fn(), create: vi.fn() }, accountLinks: { create: vi.fn() } } },
}));
vi.mock("@/lib/stripe", () => ({ stripe: stripeMock }));

import {
  REFERRAL_COOKIE,
  attributeReferral,
  getOrCreateReferralCode,
  isValidReferralCode,
  processReferralInvoice,
  readReferralCookie,
  runReferralPayouts,
} from "@/lib/referrals";
import { GET as referralLink } from "@/app/r/[code]/route";

const REFERRER = "user-referrer";
const NEW_AGENT = "user-new-agent";
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

beforeEach(() => {
  tables = {};
  idSeq = 0;
  vi.clearAllMocks();
  stripeMock.customers.retrieve.mockResolvedValue({ deleted: false, balance: 0 });
  stripeMock.invoices.createPreview.mockResolvedValue({ currency: "aud", total: 4900 });
  stripeMock.customers.createBalanceTransaction.mockResolvedValue({ id: "cbtxn_1" });
  stripeMock.transfers.create.mockResolvedValue({ id: "tr_1" });
  stripeMock.v2.core.accounts.retrieve.mockResolvedValue({
    configuration: { recipient: { capabilities: { stripe_balance: { stripe_transfers: { status: "active" } } } } },
  });
});

async function visit(path: string, host = "openhomehero.com.au") {
  const code = path.split("/r/")[1];
  const req = new NextRequest(`https://internal.netlify${path}`, { headers: { host } });
  return referralLink(req, { params: Promise.resolve({ code }) });
}

// ---------------------------------------------------------------------------

describe("Clicking a referral link (/r/CODE)", () => {
  it("sends the visitor to the signup page on the same domain", async () => {
    const res = await visit("/r/ABCD2345");
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://openhomehero.com.au/signup");
  });

  it("remembers the referrer in a cookie for 60 days", async () => {
    const res = await visit("/r/ABCD2345");
    const cookie = res.cookies.get(REFERRAL_COOKIE);
    expect(cookie?.value).toBe("ABCD2345");
    expect(cookie?.maxAge).toBe(60 * 24 * 60 * 60);
    expect(cookie?.path).toBe("/");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("lax");
  });

  it("works when someone types the code in lower case", async () => {
    const res = await visit("/r/abcd2345");
    expect(res.cookies.get(REFERRAL_COOKIE)?.value).toBe("ABCD2345");
  });

  it("still sends a broken or made-up link to signup, but remembers nothing", async () => {
    for (const bad of ["/r/AB", "/r/ABC-123", "/r/THISCODEISFARTOOLONG"]) {
      const res = await visit(bad);
      expect(res.headers.get("location")).toBe("https://openhomehero.com.au/signup");
      expect(res.cookies.get(REFERRAL_COOKIE)).toBeUndefined();
    }
  });

  it("uses http on a local test machine", async () => {
    const res = await visit("/r/ABCD2345", "localhost:3000");
    expect(res.headers.get("location")).toBe("http://localhost:3000/signup");
  });
});

describe("Each agent's referral code", () => {
  it("is 8 easy-to-read characters that the link accepts", async () => {
    const code = await getOrCreateReferralCode(makeDb(), REFERRER);
    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
    expect(isValidReferralCode(code)).toBe(true);
  });

  it("stays the same every time the agent opens the referrals page", async () => {
    const db = makeDb();
    const first = await getOrCreateReferralCode(db, REFERRER);
    const second = await getOrCreateReferralCode(db, REFERRER);
    expect(second).toBe(first);
    expect(tables.referral_codes).toHaveLength(1);
  });

  it("is different for different agents", async () => {
    const db = makeDb();
    const a = await getOrCreateReferralCode(db, "agent-a");
    const b = await getOrCreateReferralCode(db, "agent-b");
    expect(a).not.toBe(b);
  });
});

describe("Reading the referral cookie back", () => {
  it("finds it among the browser's other cookies", () => {
    expect(readReferralCookie(`sb-auth=xyz; ${REFERRAL_COOKIE}=ABCD2345; theme=dark`)).toBe("ABCD2345");
  });
  it("ignores a missing or tampered cookie", () => {
    expect(readReferralCookie(null)).toBeNull();
    expect(readReferralCookie("theme=dark")).toBeNull();
    expect(readReferralCookie(`${REFERRAL_COOKIE}=%3Cscript%3E`)).toBeNull();
  });
});

describe("Linking a new agent to whoever referred them", () => {
  async function setup() {
    const db = makeDb();
    const code = await getOrCreateReferralCode(db, REFERRER);
    return { db, cookie: `${REFERRAL_COOKIE}=${code}`, code };
  }

  it("records the referral when a brand-new agent starts their trial", async () => {
    const { db, cookie, code } = await setup();
    await attributeReferral(db, { id: NEW_AGENT, created_at: daysAgo(0) }, cookie);
    expect(tables.referrals).toEqual([
      expect.objectContaining({ referrer_user_id: REFERRER, referred_user_id: NEW_AGENT, code }),
    ]);
  });

  it("does nothing without a referral cookie", async () => {
    const { db } = await setup();
    await attributeReferral(db, { id: NEW_AGENT, created_at: daysAgo(0) }, "theme=dark");
    expect(tables.referrals ?? []).toHaveLength(0);
  });

  it("ignores a code that doesn't belong to anyone", async () => {
    const { db } = await setup();
    await attributeReferral(db, { id: NEW_AGENT, created_at: daysAgo(0) }, `${REFERRAL_COOKIE}=ZZZZ9999`);
    expect(tables.referrals ?? []).toHaveLength(0);
  });

  it("won't let an agent refer themselves", async () => {
    const { db, cookie } = await setup();
    await attributeReferral(db, { id: REFERRER, created_at: daysAgo(0) }, cookie);
    expect(tables.referrals ?? []).toHaveLength(0);
  });

  it("won't claim an account that is more than 30 days old", async () => {
    const { db, cookie } = await setup();
    await attributeReferral(db, { id: NEW_AGENT, created_at: daysAgo(31) }, cookie);
    expect(tables.referrals ?? []).toHaveLength(0);
  });

  it("keeps the first referrer if a second link is used later", async () => {
    const { db, cookie } = await setup();
    const otherCode = await getOrCreateReferralCode(db, "user-other-referrer");
    await attributeReferral(db, { id: NEW_AGENT, created_at: daysAgo(0) }, cookie);
    await attributeReferral(db, { id: NEW_AGENT, created_at: daysAgo(0) }, `${REFERRAL_COOKIE}=${otherCode}`);
    expect(tables.referrals).toHaveLength(1);
    expect(tables.referrals[0].referrer_user_id).toBe(REFERRER);
  });
});

describe("Rewarding the referrer when the new agent pays", () => {
  function invoice(id: string, amount: number, createdDaysAgo = 0, customer = "cus_new") {
    return {
      id,
      amount_paid: amount,
      currency: "aud",
      customer,
      created: Math.floor((Date.now() - createdDaysAgo * 86_400_000) / 1000),
    } as never;
  }

  function referredAccount(referrerHasSubscription: boolean) {
    tables.subscriptions = [{ user_id: NEW_AGENT, stripe_customer_id: "cus_new" }];
    if (referrerHasSubscription) {
      tables.subscriptions.push({
        user_id: REFERRER,
        stripe_customer_id: "cus_referrer",
        stripe_subscription_id: "sub_referrer",
      });
    }
    tables.referrals = [{ id: "ref-1", referrer_user_id: REFERRER, referred_user_id: NEW_AGENT, first_paid_at: null }];
  }

  it("gives 10% of the payment as credit off the referrer's next bill", async () => {
    referredAccount(true);
    await processReferralInvoice(makeDb(), invoice("in_1", 4900));
    expect(tables.referral_credits).toEqual([
      expect.objectContaining({ credit_cents: 490, balance_cents: 490, cash_cents: 0 }),
    ]);
    expect(stripeMock.customers.createBalanceTransaction).toHaveBeenCalledWith(
      "cus_referrer",
      expect.objectContaining({ amount: -490, currency: "aud" }),
      { idempotencyKey: expect.stringContaining("referral-credit-") },
    );
  });

  it("owes it as cash instead if the referrer has no bill to take it off", async () => {
    referredAccount(false);
    await processReferralInvoice(makeDb(), invoice("in_1", 4900));
    expect(tables.referral_credits[0]).toMatchObject({ credit_cents: 490, balance_cents: 0, cash_cents: 490 });
    expect(stripeMock.customers.createBalanceTransaction).not.toHaveBeenCalled();
  });

  it("never rewards the same payment twice", async () => {
    referredAccount(true);
    const db = makeDb();
    await processReferralInvoice(db, invoice("in_1", 4900));
    await processReferralInvoice(db, invoice("in_1", 4900));
    expect(tables.referral_credits).toHaveLength(1);
    expect(stripeMock.customers.createBalanceTransaction).toHaveBeenCalledTimes(1);
  });

  it("keeps rewarding monthly payments during the first 12 months", async () => {
    referredAccount(true);
    const db = makeDb();
    await processReferralInvoice(db, invoice("in_1", 4900, 300));
    await processReferralInvoice(db, invoice("in_2", 4900, 0));
    expect(tables.referral_credits).toHaveLength(2);
  });

  it("stops after 12 months of paying", async () => {
    referredAccount(true);
    const db = makeDb();
    await processReferralInvoice(db, invoice("in_1", 4900, 400));
    await processReferralInvoice(db, invoice("in_2", 4900, 0));
    expect(tables.referral_credits).toHaveLength(1);
  });

  it("ignores free invoices (like the $0 trial invoice)", async () => {
    referredAccount(true);
    await processReferralInvoice(makeDb(), invoice("in_trial", 0));
    expect(tables.referral_credits ?? []).toHaveLength(0);
    expect(tables.referrals[0].first_paid_at).toBeNull();
  });

  it("ignores payments from agents nobody referred", async () => {
    referredAccount(true);
    tables.subscriptions.push({ user_id: "someone-else", stripe_customer_id: "cus_other" });
    await processReferralInvoice(makeDb(), invoice("in_1", 4900, 0, "cus_other"));
    expect(tables.referral_credits ?? []).toHaveLength(0);
  });

  it("also works when the referred agent pays as an agency owner", async () => {
    tables.subscriptions = [];
    tables.agencies = [{ owner_user_id: NEW_AGENT, stripe_customer_id: "cus_agency" }];
    tables.referrals = [{ id: "ref-1", referrer_user_id: REFERRER, referred_user_id: NEW_AGENT, first_paid_at: null }];
    await processReferralInvoice(makeDb(), invoice("in_1", 19900, 0, "cus_agency"));
    expect(tables.referral_credits[0]).toMatchObject({ credit_cents: 1990 });
  });
});

describe("Monthly cash payouts", () => {
  function owe(cents: number) {
    tables.referral_credits = [
      { id: "c1", referrer_user_id: REFERRER, cash_cents: cents, currency: "aud", payout_id: null },
    ];
    tables.referral_payout_accounts = [{ user_id: REFERRER, stripe_account_id: "acct_ref" }];
  }

  it("waits until at least $50 is owed", async () => {
    owe(4999);
    const [result] = await runReferralPayouts(makeDb(), { dryRun: false });
    expect(result.status).toBe("below_minimum");
    expect(stripeMock.transfers.create).not.toHaveBeenCalled();
  });

  it("a practice run only reports what it would pay", async () => {
    owe(6000);
    const [result] = await runReferralPayouts(makeDb(), { dryRun: true });
    expect(result.status).toBe("would_pay");
    expect(stripeMock.transfers.create).not.toHaveBeenCalled();
  });

  it("pays once, and a second run doesn't pay the same money again", async () => {
    owe(6000);
    const db = makeDb();
    const [first] = await runReferralPayouts(db, { dryRun: false });
    const second = await runReferralPayouts(db, { dryRun: false });
    expect(first.status).toBe("paid");
    expect(second).toHaveLength(0);
    expect(stripeMock.transfers.create).toHaveBeenCalledTimes(1);
    expect(stripeMock.transfers.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 6000, currency: "aud", destination: "acct_ref" }),
      expect.anything(),
    );
  });

  it("holds the money if the referrer hasn't finished payout setup", async () => {
    owe(6000);
    tables.referral_payout_accounts = [];
    const [result] = await runReferralPayouts(makeDb(), { dryRun: false });
    expect(result.status).toBe("no_payout_account");
  });
});
