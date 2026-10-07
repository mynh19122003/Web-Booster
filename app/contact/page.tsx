import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/PageIntro";
import { metadata as makeMetadata } from "@/lib/seo";
import { ContactSections } from "@/components/pages/ContactSections";

export const metadata: Metadata = makeMetadata(
  "Contact ASCEND",
  "Contact and support information for ASCEND.",
  "/contact",
);

export default function ContactPage() {
  return (
    <>
      <PageIntro pageKey="contact" path="/contact" />
      <ContactSections />
    </>
  );
}
