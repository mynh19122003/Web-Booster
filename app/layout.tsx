import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Dialogs } from "@/components/ui/Dialogs";
import { Experience } from "@/components/ui/Experience";
import { SceneLoader } from "@/components/three/SceneLoader";
import { PointerEffects } from "@/components/ui/PointerEffects";
import { InitialLoader } from "@/components/ui/InitialLoader";
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
        <SceneLoader />
        <InitialLoader />
        <PointerEffects />
        <Header />
        <Experience>
          <main id="main">{children}</main>
        </Experience>
        <Footer />
        <Dialogs />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "ASCEND",
              url: siteUrl,
              description: "Independent gaming service concept platform",
              logo: `${siteUrl}/icon.svg`,
            }),
          }}
        />
      </body>
    </html>
  );
}
