import type { Metadata } from "next";
import { Rajdhani, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "./glass.css";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

import { SiteShell } from "@/components/layout/SiteShell";
import { metadata as makeMetadata, siteUrl } from "@/lib/seo";
export const metadata: Metadata = { ...metadataBase() };
function metadataBase(): Metadata {
  return {
    ...makeMetadata(
      "ASCEND — Boost Your Potential",
      "Expert gaming services, personal coaching, and a clear path to your next level.",
    ),
    metadataBase: new URL(siteUrl),
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
    <html lang="en" className={`${rajdhani.variable} ${plusJakartaSans.variable}`}>
      <body className="font-body text-zinc-300 antialiased leading-relaxed">
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
