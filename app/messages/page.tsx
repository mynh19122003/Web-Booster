import { BoosterChat } from "@/components/account/BoosterChat";
export const metadata = { title: "Messages and requests", description: "Send requests and chat with the ASCEND team.", robots: { index: false, follow: false } };
export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ request?: string | string[] }> }) {
  const { request } = await searchParams;
  return <div className="booster-messages-page"><BoosterChat initialRequestId={typeof request === "string" ? request : ""} /></div>;
}
