import { games } from "@/data/games";
import { services } from "@/data/services";
import { articles } from "@/data/articles";
import type { MetadataRoute } from "next";
import { siteUrl, siteIndexable } from "@/lib/seo";
import { publicCoachBases } from "@/lib/coach-ownership";

// Coach publication can change without rebuilding the app.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteIndexable) return [];
  return [
    "",
    "/services",
    "/careers",
    "/coaches",
    "/reviews",
    "/blog",
    "/support",
    "/contact",
    "/about",
    "/legal/privacy",
    "/legal/terms",
    "/legal/refund",
    "/legal/delivery-service",
    ...games.map((g) => `/games/${g.slug}`),
    ...services.map((s) => `/services/${s.slug}`),
    ...articles.map((a) => `/blog/${a.slug}`),
    ...publicCoachBases().map((coach) => `/coaches/${coach.slug}`),
  ].map((path) => ({ url: `${siteUrl}${path}` }));
}
