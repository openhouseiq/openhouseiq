import { unstable_cache } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Agents can edit their own profile data, so the stored photo address can't
 * be trusted. Only addresses inside this project's public agent-assets
 * storage are returned. Anything else (an internal address, a tracking
 * pixel on someone else's server) is ignored.
 */
function isOwnStorageUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return false;
  try {
    const url = new URL(value);
    const own = new URL(base);
    return (
      url.protocol === "https:" &&
      url.host === own.host &&
      url.pathname.startsWith("/storage/v1/object/public/agent-assets/")
    );
  } catch {
    return false;
  }
}

async function fetchAgentPhotoUrl(agentId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase.auth.admin.getUserById(agentId);

  const photoUrl = data.user?.user_metadata?.photo_url;
  return isOwnStorageUrl(photoUrl) ? photoUrl : null;
}

export function getAgentPhotoUrl(agentId: string): Promise<string | null> {
  return unstable_cache(fetchAgentPhotoUrl, ["agent-photo-url"], {
    revalidate: 60,
  })(agentId);
}
