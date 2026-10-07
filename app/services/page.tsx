import { metadata as makeMetadata } from "@/lib/seo";
import { PageIntro } from "@/components/ui/PageIntro";
import { ServiceCatalog } from "@/components/services/ServiceCatalog";
import { ServiceConfigurator } from "@/components/home/ServiceConfigurator";
export const metadata = makeMetadata(
  "Gaming Services for LoL, Valorant & TFT",
  "Compare rank progression, duo play, coaching and placement services for League of Legends, Valorant and Teamfight Tactics.",
  "/services",
);
export default function ServicesPage() {
  return (
    <>
      <PageIntro pageKey="services" path="/services" />
      <ServiceConfigurator />
      <ServiceCatalog />
    </>
  );
}
