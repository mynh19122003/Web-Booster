import { EmployeeOrderDetail } from "@/components/admin/operations/EmployeePreview";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ employee?: string }>;
}) {
  const { id } = await params;
  const { employee } = await searchParams;
  return <EmployeeOrderDetail id={id} employeeId={employee} />;
}
