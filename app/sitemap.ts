import { games } from "@/data/games";
import { services } from "@/data/services";
import { articles } from "@/data/articles";
import { siteUrl } from "@/lib/seo";
export default function sitemap() {
  return [
    "",
    "/boosters",
    "/reviews",
    "/blog",
    "/support",
    "/legal/privacy",
    "/legal/terms",
    ...games.map((g) => `/games/${g.slug}`),
    ...services.map((s) => `/services/${s.slug}`),
    ...articles.map((a) => `/blog/${a.slug}`),
  ].map((path) => ({ url: `${siteUrl}${path}` }));
}
