import { PageIntro } from "@/components/ui/PageIntro";
import { Reviews } from "@/components/home/Reviews";
import { metadata as makeMetadata } from "@/lib/seo";
export const metadata = makeMetadata(
  "Player stories",
  "Player stories and community feedback across League of Legends, Valorant and TFT.",
  "/reviews",
);
export default function Page() {
  return (
    <>
      <PageIntro pageKey="reviews" path="/reviews" />
      <Reviews />
    </>
  );
}
