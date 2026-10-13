import { EmployeeSocketChat } from "@/components/employee/EmployeeSocketChat";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>;
}) {
  const { request } = await searchParams;
  return <EmployeeSocketChat initialRequestId={request} />;
}
