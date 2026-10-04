import { Hero } from "@/components/home/Hero";
import { GameServices } from "@/components/home/GameServices";
import { ServiceConfigurator } from "@/components/home/ServiceConfigurator";
import { OrderTracking } from "@/components/home/OrderTracking";
import { FeatureShowcase } from "@/components/home/FeatureShowcase";
import { TrophyBreak } from "@/components/home/TrophyBreak";
import { Reviews } from "@/components/home/Reviews";
import { BoosterSection } from "@/components/home/BoosterSection";
import { SecuritySection } from "@/components/home/SecuritySection";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FAQ } from "@/components/home/FAQ";
import { CTA } from "@/components/home/CTA";
import { faqs } from "@/data/faqs";
export default function Home() {
  return (
    <>
      <Hero />
      <GameServices />
      <ServiceConfigurator />
      <OrderTracking />
      <FeatureShowcase />
      <TrophyBreak />
      <Reviews />
      <BoosterSection />
      <SecuritySection />
      <HowItWorks />
      <FAQ />
      <CTA />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </>
  );
}
