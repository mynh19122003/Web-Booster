import { PageIntro } from "@/components/ui/PageIntro";
import { Reviews } from "@/components/home/Reviews";
import { metadata as makeMetadata } from "@/lib/seo";
export const metadata = makeMetadata(
  "Player stories",
  "Illustrative community stories from the ASCEND concept platform.",
  "/reviews",
);
export default function Page() {
  return (
    <>
      <PageIntro
        eyebrow="COMMUNITY FIRST"
        title="The player perspective"
        description="Fictional stories that show the kind of thoughtful experience we aim to build. These are not verified customer reviews."
        path="/reviews"
      />
      <Reviews />
    </>
  );
}
