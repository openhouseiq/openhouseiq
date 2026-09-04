import { createClient } from "@supabase/supabase-js";

// Uses the service role key, which bypasses row-level security entirely.
// Only ever import this in server-only code (Route Handlers), never in
// anything that runs in the browser.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
