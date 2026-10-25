import { NextResponse } from "next/server";
import { hasBearer } from "@/lib/secureCompare";
import { createServiceClient } from "@/lib/supabase/service";
import { retentionCutoffs, UNSUCCESSFUL_DAYS_AFTER_LEASED } from "@/lib/rentalForms/retention";
import type { RentalState } from "@/lib/rentalForms/types";

// Daily job (see netlify/functions/rental-retention.ts). Removes unsuccessful
// rental applications on the timetables in lib/rentalForms/retention.ts.
// Successful applications are kept; agents can delete them from the dashboard.

export async function POST(request: Request) {
  if (!hasBearer(request, process.env.RENTAL_RETENTION_SECRET)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const supabase = createServiceClient();
  const cutoffs = retentionCutoffs();
  let removed = 0;

  // 1. Listings with a leased date: remove non-successful applications once the
  //    state's period has passed.
  for (const state of Object.keys(UNSUCCESSFUL_DAYS_AFTER_LEASED) as RentalState[]) {
    const leasedBefore = cutoffs.leasedBefore(state).toISOString().slice(0, 10);
    const { data: listings } = await supabase
      .from("listings")
      .select("id")
      .eq("state", state)
      .lte("leased_on", leasedBefore);
    const ids = (listings ?? []).map((l) => l.id);
    if (ids.length === 0) continue;
    const { data: gone, error } = await supabase
      .from("rental_applications")
      .delete()
      .in("listing_id", ids)
      .neq("status", "successful")
      .select("id");
    if (error) console.error("Retention (leased) failed:", error.message);
    removed += gone?.length ?? 0;
  }

  // 2. No leased date recorded: remove non-successful applications after the maximum period.
  const { data: stale, error: staleError } = await supabase
    .from("rental_applications")
    .select("id, listing_id, listings!inner(leased_on)")
    .neq("status", "successful")
    .lt("created_at", cutoffs.neverLeasedBefore.toISOString())
    .is("listings.leased_on", null);
  if (staleError) console.error("Retention (stale) lookup failed:", staleError.message);
  const staleIds = (stale ?? []).map((r) => r.id);
  if (staleIds.length > 0) {
    const { data: gone, error } = await supabase
      .from("rental_applications")
      .delete()
      .in("id", staleIds)
      .select("id");
    if (error) console.error("Retention (stale) delete failed:", error.message);
    removed += gone?.length ?? 0;
  }

  return NextResponse.json({ removed });
}
