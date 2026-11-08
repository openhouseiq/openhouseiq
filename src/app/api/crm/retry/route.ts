import { NextResponse } from "next/server";
import { hasBearer } from "@/lib/secureCompare";
import { createServiceClient } from "@/lib/supabase/service";
import { processDueJobs } from "@/lib/crm";

// Every 15 minutes (see netlify/functions/crm-retry.ts): re-sends visitors
// whose first send to a CRM failed (CRM busy or down, rate limited).

// The job's own secret if one is set, otherwise the site's existing shared job
// secret, so it runs without any extra Netlify setting.
const jobSecret = () => process.env.CRM_RETRY_SECRET || process.env.CONTENT_QUEUE_PUBLISH_SECRET;

export async function POST(request: Request) {
  if (!hasBearer(request, jobSecret())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const tally = await processDueJobs(createServiceClient());
  return NextResponse.json({ ok: true, ...tally });
}
