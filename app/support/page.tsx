import { PageIntro } from "@/components/ui/PageIntro";
import { SupportForm } from "@/components/ui/SupportForm";
import { FAQ } from "@/components/home/FAQ";
import { metadata as makeMetadata } from "@/lib/seo";
export const metadata = makeMetadata(
  "Help center",
  "Find answers and explore the support request demo.",
  "/support",
);
export default function Page() {
  return (
    <>
      <PageIntro
        eyebrow="WE’RE IN YOUR CORNER"
        title="A little guidance"
        description="Start with our answers below, or draft a question using the demonstration form."
        path="/support"
      />
      <div className="container">
        <SupportForm />
      </div>
      <FAQ />
    </>
  );
}
