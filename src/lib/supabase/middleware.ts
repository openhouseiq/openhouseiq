import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
  "/visit",
  "/r/",
  "/reset-password",
  "/api/feedback",
  "/api/offers",
  "/api/applicants",
  "/api/rental-applications",
  "/api/rental-retention",
  "/api/stripe/webhook",
  "/api/referrals/run-payouts",
  "/api/facebook/publish",
  "/api/facebook/insights",
  "/api/social-image",
  "/terms",
  "/preview",
  "/privacy",
  "/security",
  "/contact",
];

const AUTH_PREFIXES = ["/login", "/signup", "/forgot-password"];

/**
 * Keeps the Supabase session fresh and sends signed-out visitors to /login.
 * It only refreshes cookies and redirects. It deliberately passes no
 * identity to pages: every page and route verifies the session itself
 * (see getCurrentUser), so a request that skips this proxy gains nothing.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute = path === "/" || AUTH_PREFIXES.some((p) => path.startsWith(p));
  const isPublicRoute = isAuthRoute || PUBLIC_PREFIXES.some((p) => path.startsWith(p));

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
