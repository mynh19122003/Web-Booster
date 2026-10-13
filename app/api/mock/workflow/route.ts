import { workflowFixtures } from "@/mocks/workflow";
import chatPreview from "@/mocks/chat-preview.json";

export const dynamic = "force-dynamic";
export async function GET() {
  if (process.env.NEXT_PUBLIC_PUBLIC_DATA_SOURCE === "api") return Response.json({ error: "not-found" }, { status: 404 });
  return Response.json({ workflow: workflowFixtures(), requests: chatPreview.requests }, { headers: { "Cache-Control": "no-store" } });
}
