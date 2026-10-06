import { InvitationsPage } from "@/components/admin/portal/StaffPages";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const query = await searchParams;
  return <InvitationsPage openInvite={query.invite === "1"} />;
}
