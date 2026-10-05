import type { Metadata } from "next";
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/$/, "");
export function metadata(
  title: string,
  description: string,
  path = "/",
): Metadata {
  return {
    title,
    description,
    robots: { index: true, follow: true },
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
