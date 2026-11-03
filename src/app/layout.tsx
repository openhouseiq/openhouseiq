import { SiteFooter } from "@/components/SiteFooter";
import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import { MetaPixel } from "@/components/MetaPixel";
import { UtmCapture } from "@/components/UtmCapture";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Paste the Google Search Console "HTML tag" verification code here (the value of
// the content="..." part) to prove you own the site. Empty = no tag added.
const GOOGLE_SITE_VERIFICATION = "";

export const metadata: Metadata = {
  ...(GOOGLE_SITE_VERIFICATION ? { verification: { google: GOOGLE_SITE_VERIFICATION } } : {}),
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Open Home Hero",
  description: "Sign up and log in to Open Home Hero",
  appleWebApp: {
    title: "Open Home Hero",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Open Home Hero",
    description: "Open home feedback, offers, and listings for real estate agents.",
    siteName: "Open Home Hero",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B2430",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <MetaPixel />
        <PwaRegister />
        <UtmCapture />
        <GoogleAnalytics />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
