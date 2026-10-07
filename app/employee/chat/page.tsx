import { WorkflowChat } from "@/components/workflow/WorkflowChat";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string }>;
}) {
  const { conversation } = await searchParams;
  return <WorkflowChat mode="employee" initialConversation={conversation} />;
}
