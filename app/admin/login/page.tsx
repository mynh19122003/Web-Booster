import { LoginPage } from "@/components/admin/portal/AuthPages";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ changed?: string }>;
}) {
  const query = await searchParams;
  return <LoginPage changed={query.changed === "1"} />;
}
