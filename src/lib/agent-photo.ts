import { createServiceClient } from "@/lib/supabase/service";

export async function getAgentPhotoUrl(agentId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase.auth.admin.getUserById(agentId);

  return (data.user?.user_metadata?.photo_url as string | undefined) ?? null;
}
