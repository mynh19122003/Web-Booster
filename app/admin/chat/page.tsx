import { ChatPage } from "@/components/admin/operations/ChatPage";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return <ChatPage key={order ?? "inbox"} orderId={order} />;
}
