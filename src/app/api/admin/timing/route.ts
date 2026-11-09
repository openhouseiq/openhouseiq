import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isAdminUser } from "@/lib/admin";
import type { CurrentUser } from "@/lib/supabase/current-user";

// Temporary admin-only diagnostic: times each kind of call the dashboard makes,
// from the server, so we can see where page-load time goes. Remove after use.
export const dynamic = "force-dynamic";

async function time<T>(label: string, out: Record<string, number>, fn: () => PromiseLike<T>): Promise<T> {
  const t = performance.now();
  const r = await fn();
  out[label] = Math.round(performance.now() - t);
  return r;
}

export async function GET() {
  const out: Record<string, number> = {};
  const t0 = performance.now();
  const supabase = await createClient();
  const { data } = await time("auth.getUser (Auth server)", out, () => supabase.auth.getUser());
  const u = data.user;
  const user: CurrentUser | null = u
    ? { id: u.id, email: u.email, emailConfirmed: Boolean(u.email_confirmed_at), created_at: u.created_at, user_metadata: u.user_metadata ?? {} }
    : null;
  if (!isAdminUser(user)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await time("auth.getClaims (local)", out, () => supabase.auth.getClaims());
  await time("select subscriptions #1 (user, RLS)", out, () => supabase.from("subscriptions").select("status").eq("user_id", user.id).maybeSingle());
  await time("select subscriptions #2 (same connection)", out, () => supabase.from("subscriptions").select("status").eq("user_id", user.id).maybeSingle());
  await time("rpc user_current_agency_id", out, () => supabase.rpc("user_current_agency_id", { uid: user.id }));
  await time("select listings (RLS)", out, () => supabase.from("listings").select("id").eq("agent_id", user.id));
  await time("count feedback (RLS)", out, () => supabase.from("feedback").select("listing_id").limit(500));
  const service = createServiceClient();
  await time("service: select subscriptions #1", out, () => service.from("subscriptions").select("status").eq("user_id", user.id).maybeSingle());
  await time("service: select subscriptions #2", out, () => service.from("subscriptions").select("status").eq("user_id", user.id).maybeSingle());
  await time("8 queries in parallel", out, () =>
    Promise.all(Array.from({ length: 8 }, () => supabase.from("offers").select("listing_id").limit(200))),
  );
  out["total"] = Math.round(performance.now() - t0);
  return NextResponse.json({ region: process.env.AWS_REGION ?? process.env.VERCEL_REGION ?? "unknown", ms: out });
}
