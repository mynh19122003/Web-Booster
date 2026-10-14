import { notFound } from "next/navigation";
import { privateRobots } from "@/lib/seo";

export const metadata = { title: "Account unavailable", robots: privateRobots };

export default function AccountListingPage() {
  // Inventory API has not been connected. Never render a fictional listing.
  notFound();
}
