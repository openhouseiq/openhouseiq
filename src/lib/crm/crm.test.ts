import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";
import { decryptToken, encryptToken } from "./crypto";
import { feedbackRecord, offerRecord, type CrmFeedbackRow } from "./record";
import { CrmSendError, sendToVaultre } from "./vaultre";
import {
  disconnect,
  processDueJobs,
  processJob,
  saveConnection,
  sendSubmissionToCrm,
} from "./index";

// ---------------------------------------------------------------------------
// Minimal in-memory Supabase stand-in for the queries the CRM code makes.

type Row = Record<string, unknown>;
let tables: Record<string, Row[]>;
let seq = 0;
const UNIQUE: Record<string, string[][]> = { crm_sync_jobs: [["connection_id", "kind", "source_id"]] };
const DEFAULTS: Record<string, Row> = {
  crm_sync_jobs: { status: "pending", attempts: 0, last_error: null, external_id: null },
  crm_connections: { status: "active", last_error: null, last_sent_at: null },
};

function db() {
  return {
    from(table: string) {
      const rows = (tables[table] ??= []);
      const filters: ((r: Row) => boolean)[] = [];
      let op: "select" | "insert" | "update" = "select";
      let payload: Row = {};
      let limit = Infinity;
      const run = () => {
        if (op === "insert") {
          const row: Row = {
            id: `id-${++seq}`,
            created_at: new Date().toISOString(),
            next_attempt_at: new Date().toISOString(),
            ...DEFAULTS[table],
            ...payload,
          };
          for (const cols of UNIQUE[table] ?? []) {
            if (rows.some((r) => cols.every((c) => r[c] === row[c]))) return { data: null, error: { message: "dup" } };
          }
          rows.push(row);
          return { data: [row], error: null };
        }
        const matched = rows.filter((r) => filters.every((f) => f(r))).slice(0, limit);
        if (op === "update") matched.forEach((r) => Object.assign(r, payload));
        return { data: matched, error: null };
      };
      const b = {
        select: () => b,
        insert: (p: Row) => ((op = "insert"), (payload = p), b),
        update: (p: Row) => ((op = "update"), (payload = p), b),
        eq: (c: string, v: unknown) => (filters.push((r) => r[c] === v), b),
        neq: (c: string, v: unknown) => (filters.push((r) => r[c] !== v), b),
        lte: (c: string, v: string) => (filters.push((r) => String(r[c]) <= v), b),
        order: () => b,
        limit: (n: number) => ((limit = n), b),
        maybeSingle: async () => {
          const { data, error } = run();
          return { data: data?.[0] ?? null, error };
        },
        single: async () => {
          const { data, error } = run();
          return { data: data?.[0] ?? null, error: error ?? (data?.length ? null : { message: "none" }) };
        },
        then: (res: (v: unknown) => void) => res(run()),
      };
      return b;
    },
  } as never;
}

const fetchMock = vi.fn();

beforeEach(() => {
  tables = {};
  seq = 0;
  process.env.CRM_TOKEN_KEY = randomBytes(32).toString("base64");
  process.env.VAULTRE_API_KEY = "integrator-key";
  delete process.env.VAULTRE_ENQUIRY_SOURCE;
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 4321 }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const LISTING = { id: "listing-1", address: "12 Smith St, Toowoomba", agent_id: "agent-1", agency_id: "agency-1" };

function seedOffer() {
  tables.listings = [{ ...LISTING }];
  tables.offers = [
    {
      id: "offer-1",
      listing_id: LISTING.id,
      name: "Jo Simmons",
      email: "jo@example.com",
      phone: "0412 000 381",
      offer_amount: 812000,
      financing_type: "pre_approved",
      settlement_term: "30_days",
      waive_inspection: false,
      notes: "Flexible on date",
      created_at: "2026-11-08T01:00:00.000Z",
    },
  ];
}

const sentBodies = () =>
  fetchMock.mock.calls
    .filter(([url]) => String(url).endsWith("/enquiries"))
    .map(([, init]) => JSON.parse((init as RequestInit).body as string));

// ---------------------------------------------------------------------------

describe("Storing the agency's CRM token", () => {
  it("encrypts it, and only the same key can read it back", () => {
    const stored = encryptToken("secret-token-123");
    expect(stored).not.toContain("secret-token-123");
    expect(decryptToken(stored)).toBe("secret-token-123");
  });
  it("refuses a tampered or wrongly-keyed token", () => {
    const stored = encryptToken("secret-token-123");
    const parts = stored.split(".");
    parts[3] = Buffer.from("tampered").toString("base64url");
    expect(() => decryptToken(parts.join("."))).toThrow();
    process.env.CRM_TOKEN_KEY = randomBytes(32).toString("base64");
    expect(() => decryptToken(stored)).toThrow();
  });
});

describe("Encryption key without any extra Netlify setting", () => {
  it("falls back to a key derived from the existing Supabase secret", () => {
    delete process.env.CRM_TOKEN_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-secret";
    const stored = encryptToken("agency-token");
    expect(decryptToken(stored)).toBe("agency-token");
    process.env.SUPABASE_SERVICE_ROLE_KEY = "rotated-secret";
    expect(() => decryptToken(stored)).toThrow();
  });

  it("if the key changes, the agency is asked to reconnect and visitors are held", async () => {
    delete process.env.CRM_TOKEN_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-secret";
    seedOffer();
    const d = db();
    await saveConnection(d, { agencyId: "agency-1" }, "vaultre", "agency-token", "owner-1");
    process.env.SUPABASE_SERVICE_ROLE_KEY = "rotated-secret";
    await sendSubmissionToCrm(d, "offer", "offer-1", LISTING);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(tables.crm_connections[0].status).toBe("error");
    expect(tables.crm_sync_jobs[0].status).toBe("pending");
  });
});

describe("What gets sent for each visitor", () => {
  it("an offer: name, email, phone, and a readable summary", () => {
    seedOffer();
    const r = offerRecord(tables.offers[0] as never, LISTING);
    expect(r.subject).toBe("Offer $812,000 – 12 Smith St, Toowoomba");
    expect(r.body).toContain("Finance: Pre-approved finance");
    expect(r.body).toContain("Settlement: 30 days");
    expect(r.body).toContain("Willing to waive building & pest: No");
    expect(r.originalId).toBe("ohh-offer-offer-1");
  });

  it("feedback: interest, timeframe and ratings in plain words", () => {
    const row: CrmFeedbackRow = {
      id: "fb-1",
      is_anonymous: false,
      name: "Maya Patel",
      email: "maya@example.com",
      phone: null,
      comments: "Loved the kitchen",
      interest_level: "very_interested",
      rating_price: 3,
      rating_condition: 5,
      rating_location: null,
      rating_layout: 4,
      pre_approved: true,
      working_with_agent: false,
      purchase_timeframe: "one_to_three_months",
      wants_followup: true,
      created_at: "2026-11-08T01:00:00.000Z",
    };
    const r = feedbackRecord(row, LISTING)!;
    expect(r.subject).toBe("Open home feedback – 12 Smith St, Toowoomba");
    expect(r.body).toContain("Interest: Very interested");
    expect(r.body).toContain("Buying timeframe: 1–3 months");
    expect(r.body).toContain("Ratings: price 3/5, condition 5/5, layout 4/5");
    expect(r.body).not.toContain("location");
  });

  it("anonymous feedback is never sent (no contact details)", () => {
    expect(feedbackRecord({ is_anonymous: true } as CrmFeedbackRow, LISTING)).toBeNull();
  });
});

describe("Talking to VaultRE", () => {
  it("posts an enquiry with our API key and the agency's token", async () => {
    seedOffer();
    const id = await sendToVaultre("agency-token", offerRecord(tables.offers[0] as never, LISTING));
    expect(id).toBe("4321");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://ap-southeast-2.api.vaultre.com.au/api/v1.3/enquiries");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["X-Api-Key"]).toBe("integrator-key");
    expect(headers.Authorization).toBe("Bearer agency-token");
    expect(sentBodies()[0]).toMatchObject({
      fullName: "Jo Simmons",
      email: "jo@example.com",
      mobile: "0412 000 381",
      originalId: "ohh-offer-offer-1",
      source: "OFFICEWEBSITE",
    });
  });

  it("tells apart a revoked token, a busy CRM and a rejected record", async () => {
    seedOffer();
    const rec = offerRecord(tables.offers[0] as never, LISTING);
    fetchMock.mockResolvedValueOnce(new Response("nope", { status: 401 }));
    await expect(sendToVaultre("t", rec)).rejects.toMatchObject({ authFailed: true, retryable: false });
    fetchMock.mockResolvedValueOnce(new Response("slow down", { status: 429 }));
    await expect(sendToVaultre("t", rec)).rejects.toMatchObject({ authFailed: false, retryable: true });
    fetchMock.mockResolvedValueOnce(new Response("bad field", { status: 400 }));
    await expect(sendToVaultre("t", rec)).rejects.toBeInstanceOf(CrmSendError);
  });
});

describe("Sending visitors automatically", () => {
  const AGENCY = { agencyId: "agency-1" };

  it("does nothing when the agency hasn't connected a CRM", async () => {
    seedOffer();
    await sendSubmissionToCrm(db(), "offer", "offer-1", LISTING);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(tables.crm_sync_jobs ?? []).toHaveLength(0);
  });

  it("sends a new offer straight into the agency's VaultRE", async () => {
    seedOffer();
    const d = db();
    await saveConnection(d, AGENCY, "vaultre", "agency-token", "owner-1");
    await sendSubmissionToCrm(d, "offer", "offer-1", LISTING);
    expect(sentBodies()).toHaveLength(1);
    expect(tables.crm_sync_jobs[0]).toMatchObject({ status: "sent", external_id: "4321", attempts: 1 });
    expect(tables.crm_connections[0].last_sent_at).toBeTruthy();
  });

  it("a solo agent's listing uses their own connection", async () => {
    seedOffer();
    const d = db();
    await saveConnection(d, { userId: "agent-1" }, "vaultre", "solo-token", "agent-1");
    await sendSubmissionToCrm(d, "offer", "offer-1", { agent_id: "agent-1", agency_id: null });
    expect(sentBodies()).toHaveLength(1);
  });

  it("never sends the same visitor twice", async () => {
    seedOffer();
    const d = db();
    await saveConnection(d, AGENCY, "vaultre", "agency-token", "owner-1");
    await sendSubmissionToCrm(d, "offer", "offer-1", LISTING);
    await sendSubmissionToCrm(d, "offer", "offer-1", LISTING);
    expect(sentBodies()).toHaveLength(1);
  });

  it("if VaultRE is down, tries again later, then gives up after 6 tries", async () => {
    seedOffer();
    const d = db();
    await saveConnection(d, AGENCY, "vaultre", "agency-token", "owner-1");
    fetchMock.mockImplementation(async () => new Response("down", { status: 503 }));
    await sendSubmissionToCrm(d, "offer", "offer-1", LISTING);
    const job = tables.crm_sync_jobs[0];
    expect(job).toMatchObject({ status: "pending", attempts: 1 });
    expect(new Date(job.next_attempt_at as string).getTime()).toBeGreaterThan(Date.now() + 4 * 60_000);
    for (let i = 0; i < 5; i++) await processJob(d, job.id as string);
    expect(job).toMatchObject({ status: "failed", attempts: 6 });
  });

  it("if the agency revokes access, holds visitors until they reconnect, then sends them", async () => {
    seedOffer();
    const d = db();
    await saveConnection(d, AGENCY, "vaultre", "old-token", "owner-1");
    fetchMock.mockResolvedValueOnce(new Response("revoked", { status: 401 }));
    await sendSubmissionToCrm(d, "offer", "offer-1", LISTING);
    expect(tables.crm_connections[0].status).toBe("error");
    expect(tables.crm_sync_jobs[0].status).toBe("pending");

    await saveConnection(d, AGENCY, "vaultre", "new-token", "owner-1");
    expect(tables.crm_connections).toHaveLength(1);
    expect(tables.crm_connections[0].status).toBe("active");
    await processDueJobs(d);
    expect(tables.crm_sync_jobs[0].status).toBe("sent");
    const last = fetchMock.mock.calls.at(-1)![1] as RequestInit;
    expect((last.headers as Record<string, string>).Authorization).toBe("Bearer new-token");
  });

  it("after disconnecting, nothing more is sent and the token is wiped", async () => {
    seedOffer();
    const d = db();
    await saveConnection(d, AGENCY, "vaultre", "agency-token", "owner-1");
    await disconnect(d, AGENCY);
    expect(tables.crm_connections[0]).toMatchObject({ status: "disconnected", token_encrypted: "" });
    await sendSubmissionToCrm(d, "offer", "offer-1", LISTING);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("skips anonymous feedback without calling VaultRE", async () => {
    tables.listings = [{ ...LISTING }];
    tables.feedback = [{ id: "fb-anon", listing_id: LISTING.id, is_anonymous: true, created_at: "2026-11-08T00:00:00Z" }];
    const d = db();
    await saveConnection(d, AGENCY, "vaultre", "agency-token", "owner-1");
    await sendSubmissionToCrm(d, "feedback", "fb-anon", LISTING);
    expect(tables.crm_sync_jobs[0].status).toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stays switched off until VaultRE approves us (no integrator key)", async () => {
    seedOffer();
    const d = db();
    await saveConnection(d, AGENCY, "vaultre", "agency-token", "owner-1");
    delete process.env.VAULTRE_API_KEY;
    await sendSubmissionToCrm(d, "offer", "offer-1", LISTING);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(tables.crm_sync_jobs[0].status).toBe("pending");
  });
});
