import { DEFAULT_SITE_URL } from "@/lib/brand";
import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/api", "/visit"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
