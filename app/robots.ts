import type { MetadataRoute } from "next";
import { PRODUCTION_SITE_URL } from "../lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin/",
    },
    sitemap: `${PRODUCTION_SITE_URL}/sitemap.xml`,
  };
}
