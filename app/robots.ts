import type { MetadataRoute } from "next";
import { siteUrl, siteIndexable } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  return {
    // Let crawlers read noindex on private and pre-launch pages.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
    sitemap: siteIndexable ? `${siteUrl}/sitemap.xml` : undefined,
  };
}
