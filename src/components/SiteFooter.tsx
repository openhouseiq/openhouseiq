import { SocialLinks } from "@/components/SocialLinks";

// Shown at the bottom of every page: small, quiet, and easy to find.
export function SiteFooter() {
  return (
    <footer className="print:hidden border-t border-line bg-paper py-4">
      <SocialLinks />
    </footer>
  );
}
