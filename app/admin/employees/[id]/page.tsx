import { AdminEmployeeDetail } from "@/components/workflow/AdminEmployees";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminEmployeeDetail id={id} />;
}
