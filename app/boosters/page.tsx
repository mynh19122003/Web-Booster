import { PageIntro } from "@/components/ui/PageIntro";
import { BoosterSection } from "@/components/home/BoosterSection";
import { metadata as makeMetadata } from "@/lib/seo";
export const metadata = makeMetadata(
  "Meet the pros",
  "Explore the fictional ASCEND player roster.",
  "/boosters",
);
export default function Page() {
  return (
    <>
      <PageIntro
        eyebrow="THE ASCEND ROSTER"
        title="Talent meets ambition"
        description="Meet our concept roster. These original profiles illustrate the future player selection experience."
        path="/boosters"
      />
      <BoosterSection />
    </>
  );
}
