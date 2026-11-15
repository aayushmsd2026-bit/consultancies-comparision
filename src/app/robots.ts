import type { MetadataRoute } from "next";
import { IS_PRODUCTION, SITE_URL } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  // Test and preview sites hold demo data. Search engines must stay out of them.
  if (!IS_PRODUCTION) return { rules: { userAgent: "*", disallow: "/" } };

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/*/admin", "/*/styleguide", "/*/report/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
