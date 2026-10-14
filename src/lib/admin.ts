import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, type CurrentUser } from "@/lib/supabase/current-user";

/** Emails allowed into the admin area, from the ADMIN_EMAILS setting. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * True only for a signed-in user whose email is on the admin list AND has
 * been confirmed, so an unconfirmed account registered with an admin's
 * address can never pass.
 */
export function isAdminUser(user: CurrentUser | null): user is CurrentUser {
  if (!user || !user.email || !user.emailConfirmed) return false;
  return adminEmails().includes(user.email.toLowerCase());
}

/**
 * The signed-in admin, or null. Beyond being on the admin list, the session
 * must have passed two-step login (an authenticator code). Set
 * ADMIN_REQUIRE_MFA=false only to temporarily switch that requirement off.
 */
export async function getAdminUser(): Promise<CurrentUser | null> {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) return null;
  if (process.env.ADMIN_REQUIRE_MFA === "false") return user;

  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return data?.currentLevel === "aal2" ? user : null;
}
