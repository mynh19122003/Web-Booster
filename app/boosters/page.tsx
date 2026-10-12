import { PageIntro } from "@/components/ui/PageIntro";
import { metadata as makeMetadata, privateRobots } from "@/lib/seo";
export const metadata = { ...makeMetadata(
  "Meet the pros",
  "Explore the fictional ASCEND player roster.",
  "/boosters",
), robots: privateRobots };
export default function Page() {
  return (
    <>
      <PageIntro pageKey="boosters" path="/boosters" />
    </>
  );
}
