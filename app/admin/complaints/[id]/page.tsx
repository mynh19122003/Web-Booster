import { ComplaintDetail } from "@/components/workflow/Complaints";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ComplaintDetail id={id} />;
}
