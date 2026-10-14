import type { Metadata } from "next";
import { Inter, Rajdhani, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./glass.css";
import "./layout-alignment.css";
import "./support-chat.css";
import "./messenger-chat.css";
import "./riot-matches.css";
import "./employee-riot.css";
import "./order-workspace.css";
import "./coach-refinements.css";
import "./interaction-refinements.css";
import "./home-refinements.css";

const rajdhani = Rajdhani({
  // Rajdhani has no Vietnamese glyph subset; Vietnamese headings use the body font.
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-ascend-heading",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext", "vietnamese", "cyrillic-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ascend-body",
  display: "swap",
});

const interPrice = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["600"],
  variable: "--font-ascend-price",
  display: "swap",
  preload: false,
});

import { SiteShell } from "@/components/layout/SiteShell";
import { metadata as makeMetadata, siteUrl } from "@/lib/seo";
import { serializeJsonLd } from "@/lib/json-ld";
export const metadata: Metadata = { ...metadataBase() };
function metadataBase(): Metadata {
  return {
    ...makeMetadata(
      "ASCEND — Boost Your Potential",
      "Expert gaming services, personal coaching, and a clear path to your next level.",
    ),
    metadataBase: new URL(siteUrl),
    // Every indexable page sets its own canonical; never inherit the homepage URL.
    alternates: undefined,
    openGraph: undefined,
    verification: process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : undefined,
    title: {
      default: "ASCEND — Boost Your Potential",
      template: "%s | ASCEND",
    },
    icons: { icon: "/icon.svg" },
  };
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${rajdhani.variable} ${plusJakartaSans.variable} ${interPrice.variable}`}>
      <body className="font-body text-zinc-300 antialiased leading-relaxed">
        <SiteShell>{children}</SiteShell>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd({
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": `${siteUrl}/#organization`,
              name: "ASCEND",
              url: siteUrl,
              description:
                "Independent gaming services for League of Legends, Valorant and Teamfight Tactics",
              logo: `${siteUrl}/icon.svg`,
            }),
          }}
        />
      </body>
    </html>
  );
}
