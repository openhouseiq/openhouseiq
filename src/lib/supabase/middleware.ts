import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-user");

  let pendingCookies: { name: string; value: string; options: CookieOptions }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          pendingCookies = cookiesToSet;
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware has already cryptographically verified this JWT — forward the
  // result to pages/route handlers via a header so they don't have to pay
  // for a second round-trip to re-verify the same token.
  if (user) {
    requestHeaders.set(
      "x-user",
      JSON.stringify({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        user_metadata: user.user_metadata ?? {},
      }),
    );
  }

  const supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });
  pendingCookies.forEach(({ name, value, options }) =>
    supabaseResponse.cookies.set(name, value, options),
  );

  const isAuthRoute =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup") ||
    request.nextUrl.pathname.startsWith("/forgot-password");
  const isPublicRoute =
    isAuthRoute ||
    request.nextUrl.pathname.startsWith("/visit") ||
    request.nextUrl.pathname.startsWith("/reset-password") ||
    request.nextUrl.pathname.startsWith("/api/feedback") ||
    request.nextUrl.pathname.startsWith("/api/offers") ||
    request.nextUrl.pathname.startsWith("/api/stripe/webhook") ||
    request.nextUrl.pathname.startsWith("/api/signup-profile") ||
    request.nextUrl.pathname.startsWith("/terms") ||
    request.nextUrl.pathname.startsWith("/privacy") ||
    request.nextUrl.pathname.startsWith("/security");

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
