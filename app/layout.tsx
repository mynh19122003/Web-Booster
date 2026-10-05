import type { Metadata } from "next";
import "./globals.css";
import { SiteShell } from "@/components/layout/SiteShell";
import { metadata as makeMetadata, siteUrl } from "@/lib/seo";
export const metadata: Metadata = { ...metadataBase() };
function metadataBase(): Metadata {
  return {
    ...makeMetadata(
      "ASCEND — A higher standard of play",
      "Expert gaming services, personal coaching, and a clear path to your next level.",
    ),
    metadataBase: new URL(siteUrl),
    title: {
      default: "ASCEND — A higher standard of play",
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
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteShell>{children}</SiteShell>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
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
