import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

async function fetchEmailNotificationsEnabled(agentId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase.auth.admin.getUserById(agentId);

  const value = data.user?.user_metadata?.email_notifications_enabled as
    | boolean
    | undefined;

  // Default to on for agents who haven't set a preference yet.
  return value ?? true;
}

export function getAgentEmailNotificationsEnabled(agentId: string): Promise<boolean> {
  return unstable_cache(fetchEmailNotificationsEnabled, ["agent-email-notifications"], {
    revalidate: 60,
  })(agentId);
}
