import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start your free trial — Open Home Hero",
  description:
    "Create your Open Home Hero account and start a 14-day free trial. One QR code per listing for open home feedback and offers. No card needed to start.",
  alternates: { canonical: "/signup" },
};

export default function SignupLayout({ children }: LayoutProps<"/signup">) {
  return children;
}
