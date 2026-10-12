import { PageIntro } from "@/components/ui/PageIntro";
import { SupportForm } from "@/components/ui/SupportForm";
import { FAQ } from "@/components/home/FAQ";
import { metadata as makeMetadata } from "@/lib/seo";
export const metadata = makeMetadata(
  "Help center",
  "Find answers, send a support request, and chat with our team.",
  "/support",
);
export default function Page() {
  return (
    <>
      <PageIntro pageKey="support" path="/support" />
      <div className="container">
        <SupportForm />
      </div>
      <FAQ />
    </>
  );
}
