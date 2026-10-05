import { NextResponse, type NextRequest } from "next/server";
import {
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_DAYS,
  isValidReferralCode,
} from "@/lib/referrals";

// A referral link: remembers who sent this visitor, then sends them to sign up.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const normalised = code.toUpperCase();

  const url = request.nextUrl.clone();
  url.pathname = "/signup";
  url.search = "";
  const response = NextResponse.redirect(url);

  // The code isn't checked against the database here, so this link can't be
  // used to find out which codes exist. It's validated when it's attributed.
  if (isValidReferralCode(normalised)) {
    response.cookies.set({
      name: REFERRAL_COOKIE,
      value: normalised,
      maxAge: REFERRAL_COOKIE_DAYS * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });
  }

  return response;
}
