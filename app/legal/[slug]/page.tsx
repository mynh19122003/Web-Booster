import { notFound } from "next/navigation";
import { PageIntro } from "@/components/ui/PageIntro";
import { metadata } from "@/lib/seo";

const documents = {
  privacy: {
    title: "Privacy policy",
    description: "What information this ASCEND demo handles and how it is stored.",
    sections: [
      {
        title: "Information this demo handles",
        paragraphs: [
          "If you create an account, the site stores your name, email address, a scrypt password hash (not your plain-text password), and session records in a local SQLite database operated with this project. Session cookies are HTTP-only; the database stores a hash of each session token. The local session expires after 30 days.",
          "If Google sign-in is configured by the operator, Google supplies a verified email address, display name, and account subject identifier for sign-in. Google sign-in is not available until the operator configures it.",
          "Saved service requests and recruitment applications in this demo are kept in the browser's local storage on the device and browser where they were submitted. The support form only validates in the browser and does not send a message.",
        ],
      },
      {
        title: "Use, storage, and sharing",
        paragraphs: [
          "Information is used to provide the demo account and keep its sign-in session. The operator may also receive routine technical logs from the hosting environment. This project does not include advertising or analytics integrations. No payment processor is connected.",
          "Account records remain in the operator's SQLite database until the operator removes them. This demo does not currently provide a self-service account deletion control. Local plans and applications can be removed by clearing this site's browser storage. Do not enter sensitive or real customer information in this preview.",
          "When Google sign-in is enabled, authentication requests are handled by Google and are subject to Google's own privacy terms. The site does not request or store game account passwords.",
        ],
      },
      {
        title: "Your choices and policy changes",
        paragraphs: [
          "You can stop using the demo at any time and clear browser storage from your browser settings. A production service must publish an operator-controlled contact method and a process for privacy requests before collecting real customer data.",
          "This notice describes the current local preview, not a complete policy for a live business. The applicable operator, location, hosting providers, retention schedule, and legal requirements have not been supplied. The notice must be reviewed and updated before launch.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of service",
    description: "Terms for using the ASCEND demonstration website.",
    sections: [
      {
        title: "Demo status",
        paragraphs: [
          "ASCEND is currently a demonstration concept, not an active gaming-service business. Prices, exchange conversions, delivery windows, service descriptions, profiles, reviews, and account screens are illustrative. A saved plan is not an order, booking, or contract. No payment is collected and no boosting, coaching, or placement service is delivered through this site.",
        ],
      },
      {
        title: "Accounts and acceptable use",
        paragraphs: [
          "Keep your sign-in details secure and use only an email address you control. Account creation is provided for preview purposes; password recovery and self-service account deletion are not currently available. Do not submit confidential, sensitive, or third-party personal information.",
          "The site does not request game account credentials. If services are offered in the future, users must review the relevant publisher rules first. Account sharing, boosting, or other activities may be restricted by a game's publisher. No rank result, match outcome, or delivery time is guaranteed.",
        ],
      },
      {
        title: "Third-party names and future changes",
        paragraphs: [
          "League of Legends, VALORANT, Teamfight Tactics, and other third-party names and marks belong to their respective owners. ASCEND is an independent concept and is not affiliated with, endorsed by, or sponsored by Riot Games or any game publisher.",
          "These demo terms do not establish a paid-service, cancellation, or dispute process. Before any commercial launch, the operator must publish complete terms, identity and contact details, service scope, and applicable consumer rights for the relevant locations.",
        ],
      },
    ],
  },
  refund: {
    title: "Refund policy",
    description: "Payment and refund status for the ASCEND demo.",
    sections: [
      {
        title: "No payments in this demo",
        paragraphs: [
          "This website does not accept payments, charge a card, or create paid orders. Quotes are examples only. Since no transaction is made here, there is no demo payment to refund. Do not send money to anyone claiming to collect payment for this preview.",
        ],
      },
      {
        title: "Before a commercial service launches",
        paragraphs: [
          "No paid-service refund window, cancellation fee, eligibility test, or processing timeline has been established. If ASCEND becomes a live service, the operator must publish a transaction-specific refund and cancellation policy before accepting an order, and provide a working contact channel for requests.",
          "Nothing on this demo page is intended to remove consumer rights that apply under the laws governing a future transaction. The operator and governing jurisdiction have not yet been supplied, so this notice is not a substitute for a reviewed commercial policy.",
        ],
      },
    ],
  },
  "delivery-service": {
    title: "Delivery and service policy",
    description: "How service availability and delivery estimates work in this demo.",
    sections: [
      {
        title: "No service delivery in the preview",
        paragraphs: [
          "The configurator is interactive, but it does not assign a booster, coach, or match service. Displayed delivery windows, progress, and prices are illustrative estimates only. Submitting or saving a plan does not start work or reserve a place in a queue.",
        ],
      },
      {
        title: "If services are offered in the future",
        paragraphs: [
          "A live order page would need to confirm the exact service, game, region, scope, price, estimated start and completion windows, customer responsibilities, and how delays or cancellations are handled. No guaranteed completion time or rank outcome is promised by this demo.",
          "The site does not ask for game passwords. Any future operating process should avoid requesting credentials and should clearly explain how customer accounts and personal data are protected. Publisher rules may restrict account sharing or boosting; users should review those rules before purchasing any service.",
          "There is no live order support or delivery contact channel configured. The form at the help center is a local demo and does not send its contents.",
        ],
      },
    ],
  },
} as const;

type PolicySlug = keyof typeof documents;

export function generateStaticParams() {
  return Object.keys(documents).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  if (!(slug in documents)) notFound();
  const document = documents[slug as PolicySlug];
  return metadata(document.title, document.description, `/legal/${slug}`);
}

export default async function Page({ params }: PageProps<"/legal/[slug]">) {
  const { slug } = await params;
  if (!(slug in documents)) notFound();
  const document = documents[slug as PolicySlug];
  return (
    <>
      <PageIntro
        eyebrow="POLICIES AND DISCLOSURES"
        title={document.title}
        description={document.description}
        path={`/legal/${slug}`}
      />
      <article className="container prose section">
        <p className="policy-updated">Demo policy · Last updated October 4, 2026</p>
        {document.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}
      </article>
    </>
  );
}
