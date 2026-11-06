import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in — Open Home Hero",
  description:
    "Log in to your Open Home Hero account to see open home feedback and offers for your listings, download QR codes and export your leads.",
  alternates: { canonical: "/login" },
  // A login form has nothing for searchers; keep it out of results but let
  // crawlers follow its links.
  robots: { index: false, follow: true },
};

export default function LoginLayout({ children }: LayoutProps<"/login">) {
  return children;
}
