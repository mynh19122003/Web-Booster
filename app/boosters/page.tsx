import { PageIntro } from "@/components/ui/PageIntro";
import { metadata as makeMetadata } from "@/lib/seo";
export const metadata = makeMetadata(
  "Meet the pros",
  "Explore the fictional ASCEND player roster.",
  "/boosters",
);
export default function Page() {
  return (
    <>
      <PageIntro pageKey="boosters" path="/boosters" />
    </>
  );
}
