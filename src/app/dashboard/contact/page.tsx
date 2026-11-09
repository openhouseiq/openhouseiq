import { redirect } from "next/navigation";

// Contact us now lives in Settings, as its own tab.
export default function ContactPage() {
  redirect("/dashboard/settings?tab=contact");
}
