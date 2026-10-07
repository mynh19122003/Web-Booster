import { EmployeeOrderDetail } from "@/components/workflow/EmployeePages";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EmployeeOrderDetail id={id} />;
}
