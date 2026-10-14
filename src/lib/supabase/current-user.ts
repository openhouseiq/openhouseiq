import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | undefined;
  emailConfirmed: boolean;
  created_at: string;
  user_metadata: Record<string, unknown>;
};

/**
 * The signed-in user for this request, or null. Asks Supabase Auth to verify
 * the session cookie itself on every call, so nothing a caller sends in a
 * header or body can claim to be a user. Memoised per request, so pages that
 * call it several times only pay for one check.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  return {
    id: user.id,
    email: user.email,
    emailConfirmed: Boolean(user.email_confirmed_at),
    created_at: user.created_at,
    user_metadata: user.user_metadata ?? {},
  };
});
