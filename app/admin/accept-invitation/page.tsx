import { AcceptInvitationPage } from "@/components/admin/portal/AuthPages";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const query = await searchParams;
  return <AcceptInvitationPage token={query.token ?? ""} />;
}
