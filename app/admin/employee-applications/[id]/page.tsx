import { ApplicationDetail } from "@/components/admin/portal/ApplicationPages";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ApplicationDetail id={id} />;
}
