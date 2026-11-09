"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { label: "Profile", tab: "profile" },
  { label: "Billing", tab: "billing" },
  { label: "FAQ", tab: "faq" },
  { label: "Contact us", tab: "contact" },
] as const;

const SETTINGS = "/dashboard/settings";

/**
 * Profile, Billing, FAQ and Contact us are tabs of one page. When you're
 * already on it, switching just updates the address bar (no server trip);
 * from anywhere else it's a normal link.
 */
export function HeaderNav() {
  const pathname = usePathname();
  return (
    <>
      {NAV.map((item) => {
        const href = item.tab === "profile" ? SETTINGS : `${SETTINGS}?tab=${item.tab}`;
        return (
          <Link
            key={item.tab}
            href={href}
            onClick={(e) => {
              if (pathname !== SETTINGS || e.metaKey || e.ctrlKey || e.shiftKey) return;
              e.preventDefault();
              window.history.pushState(null, "", href);
              window.scrollTo({ top: 0 });
            }}
            className="whitespace-nowrap text-navy-soft hover:text-brass"
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
