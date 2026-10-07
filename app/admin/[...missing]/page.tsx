import { notFound } from "next/navigation";

export const dynamic = "force-static";

/** Keep obsolete admin URLs inside the admin layout with the not-found UI. */
export default function MissingAdminPage() {
  notFound();
}
