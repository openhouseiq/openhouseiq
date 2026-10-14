import { createServiceClient } from "@/lib/supabase/service";

const WINDOW_SECONDS = 60;

const LIMITS: Record<string, number> = {
  feedback: 5,
  offers: 5,
  applicants: 5,
  contact: 5,
  "account-delete": 5,
  "agency-invite": 10,
  "agency-accept": 10,
  // Per listing, across all visitors: stops one listing's agent being
  // flooded with notification emails by many different addresses.
  "feedback-listing": 30,
  "offers-listing": 30,
  "applicants-listing": 30,
};

/**
 * Returns true if the request is allowed, false if it should be rejected (429).
 * The count is updated in one atomic database call, so simultaneous requests
 * can't slip past the limit. If the limiter itself fails the request is
 * refused, not waved through.
 */
export async function checkRateLimit(routeKey: string, identifier: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: `${routeKey}:${identifier}`,
    p_limit: LIMITS[routeKey] ?? 10,
    p_window_seconds: WINDOW_SECONDS,
  });

  if (error) {
    // The atomic function comes from migration 0031. If this code is live
    // before that migration has been run, keep working with the older
    // read-then-write limiter rather than blocking every visitor form.
    if (error.code === "PGRST202" || error.code === "42883") {
      return legacyCheckRateLimit(`${routeKey}:${identifier}`, LIMITS[routeKey] ?? 10);
    }
    console.error("Rate limiter failed:", error.message);
    return false;
  }
  return data === true;
}

async function legacyCheckRateLimit(key: string, limit: number): Promise<boolean> {
  const supabase = createServiceClient();
  const now = Date.now();
  const { data: existing } = await supabase
    .from("api_rate_limits")
    .select("window_start, count")
    .eq("key", key)
    .maybeSingle();

  if (!existing || now - new Date(existing.window_start).getTime() > WINDOW_SECONDS * 1000) {
    await supabase
      .from("api_rate_limits")
      .upsert({ key, window_start: new Date(now).toISOString(), count: 1 });
    return true;
  }
  if (existing.count >= limit) return false;
  await supabase
    .from("api_rate_limits")
    .update({ count: existing.count + 1 })
    .eq("key", key);
  return true;
}

/**
 * The visitor's address as seen by Netlify's edge, which a visitor cannot
 * set. X-Forwarded-For is only a fallback for local development, because
 * a visitor can put anything in it.
 */
export function clientIp(request: Request): string {
  const edge = request.headers.get("x-nf-client-connection-ip");
  if (edge) return edge.trim();
  if (process.env.NODE_ENV !== "production") {
    const forwarded = request.headers.get("x-forwarded-for");
    return forwarded?.split(",")[0]?.trim() || "local";
  }
  return "unknown";
}
