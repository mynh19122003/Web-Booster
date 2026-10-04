import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageIntro } from "@/components/ui/PageIntro";
import { metadata as makeMetadata } from "@/lib/seo";

export const metadata: Metadata = makeMetadata(
  "Contact ASCEND",
  "Contact and support-channel information for the ASCEND demo.",
  "/contact",
);

export default function ContactPage() {
  return (
    <>
      <PageIntro
        eyebrow="CONTACT"
        title="We’re here to help"
        description="Support-channel information for the current ASCEND preview."
        path="/contact"
      />
      <article className="container prose section contact-content">
        <section>
          <h2>Current support channel</h2>
          <p>
            This local preview has no monitored support inbox, phone number, or
            operating business address. The help-center form is a demonstration:
            it validates in your browser and does not send or store a message.
            Please do not submit real or sensitive personal information.
          </p>
          <Link className="text-link" href="/support">
            Open the help-center demo <ArrowUpRight size={16} />
          </Link>
        </section>
        <section>
          <h2>Business enquiries</h2>
          <p>
            The legal operator and business contact details have not been
            provided. See <Link href="/about">About / Business Information</Link>
            for the current disclosures. A working contact method must be
            configured before this site is used for a live service.
          </p>
        </section>
      </article>
    </>
  );
}
