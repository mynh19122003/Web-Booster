import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/PageIntro";
import { metadata as makeMetadata } from "@/lib/seo";
import { AboutSections } from "@/components/pages/AboutSections";

export const metadata: Metadata = makeMetadata(
  "About and business information",
  "Learn what ASCEND is and review the operator information currently available.",
  "/about",
);

export default function AboutPage() {
  return (
    <>
      <PageIntro pageKey="about" path="/about" />
      <AboutSections />
    </>
  );
}
