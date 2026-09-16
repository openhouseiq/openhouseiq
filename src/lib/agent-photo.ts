import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

async function fetchAgentPhotoUrl(agentId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase.auth.admin.getUserById(agentId);

  return (data.user?.user_metadata?.photo_url as string | undefined) ?? null;
}

export function getAgentPhotoUrl(agentId: string): Promise<string | null> {
  return unstable_cache(fetchAgentPhotoUrl, ["agent-photo-url"], {
    revalidate: 60,
  })(agentId);
}
