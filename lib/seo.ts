import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-url";
import { canIndexSite } from "@/lib/indexing";
export { siteUrl } from "@/lib/site-url";
export const siteIndexable = canIndexSite(siteUrl, process.env.SITE_INDEXABLE, process.env.VERCEL_ENV);
export const privateRobots: Metadata["robots"] = { index: false, follow: false };
export function metadata(
  title: string,
  description: string,
  path = "/",
): Metadata {
  return {
    title,
    description,
    robots: { index: siteIndexable, follow: true },
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "ASCEND",
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}
