import { createServiceClient } from "@/lib/supabase/service";

const WINDOW_MS = 60_000;

const LIMITS: Record<string, number> = {
  feedback: 5,
  offers: 5,
  "signup-profile": 10,
};

/** Returns true if the request is allowed, false if it should be rejected (429). */
export async function checkRateLimit(routeKey: string, identifier: string): Promise<boolean> {
  const supabase = createServiceClient();
  const key = `${routeKey}:${identifier}`;
  const limit = LIMITS[routeKey] ?? 10;
  const now = Date.now();

  const { data: existing } = await supabase
    .from("api_rate_limits")
    .select("window_start, count")
    .eq("key", key)
    .maybeSingle();

  if (!existing || now - new Date(existing.window_start).getTime() > WINDOW_MS) {
    await supabase
      .from("api_rate_limits")
      .upsert({ key, window_start: new Date(now).toISOString(), count: 1 });
    return true;
  }

  if (existing.count >= limit) {
    return false;
  }

  await supabase
    .from("api_rate_limits")
    .update({ count: existing.count + 1 })
    .eq("key", key);
  return true;
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
