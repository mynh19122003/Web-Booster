import { metadata as makeMetadata } from "@/lib/seo";
import { PageIntro } from "@/components/ui/PageIntro";
import { RecruitmentSection } from "@/components/home/RecruitmentSection";
export const metadata = makeMetadata(
  "Gaming Coach & Booster Applications",
  "Apply to join Ascend as a League of Legends, Valorant or Teamfight Tactics coach. Share your rank, experience and contact information.",
  "/careers",
);
export default function CareersPage() {
  return (
    <>
      <PageIntro pageKey="careers" path="/careers" />
      <RecruitmentSection />
    </>
  );
}
