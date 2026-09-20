import { headers } from "next/headers";

export type CurrentUser = {
  id: string;
  email: string | undefined;
  created_at: string;
  user_metadata: Record<string, unknown>;
};

/**
 * Reads the user info middleware already verified for this request, instead
 * of re-validating the same JWT a second time. Only trustworthy because the
 * middleware matcher (proxy.ts) covers every route this is used from — it
 * always runs first and sets/clears this header itself.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const headerList = await headers();
  const raw = headerList.get("x-user");
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}
