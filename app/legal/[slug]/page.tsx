import { notFound } from "next/navigation";
import { PageIntro } from "@/components/ui/PageIntro";
import { metadata } from "@/lib/seo";
const documents = {
  privacy: {
    title: "Privacy policy",
    text: "This concept website does not request game credentials, process payments, or send support form submissions. When you save a demo plan, your selections are stored in your browser’s localStorage. You can remove them by clearing site data in your browser. Hosting providers may process technical access logs. No analytics or advertising trackers are installed. Replace this notice with a policy reflecting your actual deployment before operating a live service.",
  },
  terms: {
    title: "Terms of service",
    text: "ASCEND is an interactive concept website. Prices, timelines, profiles, reviews, and dashboard activity are illustrative. Saving a plan does not form a purchase agreement or book a service. Game names remain the property of their respective owners; ASCEND is not affiliated with or endorsed by those publishers. Account sharing and boosting may conflict with publisher terms. No claim of publisher approval or guaranteed rank progression is made. A live service requires its own operator details, commercial terms, refund policy, and support process.",
  },
};
export function generateStaticParams() {
  return Object.keys(documents).map((slug) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return metadata(
    slug === "privacy" ? "Privacy policy" : "Terms of service",
    "Information about the ASCEND demonstration website.",
    `/legal/${slug}`,
  );
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug !== "privacy" && slug !== "terms") notFound();
  const d = documents[slug];
  return (
    <>
      <PageIntro
        eyebrow="TRANSPARENCY FIRST"
        title={d.title}
        description="Concept website notice · October 2026"
        path={`/legal/${slug}`}
      />
      <div className="container prose section">
        <p>{d.text}</p>
      </div>
    </>
  );
}
