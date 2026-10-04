import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/PageIntro";
import { metadata as makeMetadata } from "@/lib/seo";

export const metadata: Metadata = makeMetadata(
  "About and business information",
  "Learn what ASCEND is and review the operator information currently available.",
  "/about",
);

const businessDetails = [
  ["Public name", "ASCEND (concept brand)"],
  ["Legal operator", "Not provided"],
  ["Business registration", "Not provided"],
  ["Registered address", "Not provided"],
  ["Operating status", "Demonstration website; services are not active"],
  ["Payments", "Not accepted on this website"],
];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="ABOUT ASCEND"
        title="A concept for your next level"
        description="An independent gaming-services concept exploring a clearer way to plan a competitive climb."
        path="/about"
      />
      <article className="container prose section">
        <section>
          <h2>What this site is</h2>
          <p>
            ASCEND is a demonstration website for League of Legends, VALORANT,
            and Teamfight Tactics service concepts. The rank configurator,
            prices, delivery estimates, reviews, and service descriptions are
            examples; they do not represent available or fulfilled services.
          </p>
          <p>
            ASCEND is independent and is not affiliated with, endorsed by, or
            sponsored by Riot Games. Game names and marks remain the property of
            their respective owners.
          </p>
        </section>
        <section>
          <h2>Business information</h2>
          <dl className="business-details">
            {businessDetails.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>
            Legal entity, registration, and address details have not been
            provided for this project. They must be added and verified by the
            operator before the site is used to offer or sell services.
          </p>
        </section>
      </article>
    </>
  );
}
