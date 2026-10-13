import { mockProfile, mockRequests, mockMessages } from "@/mocks/public";
export const dynamic = "force-dynamic";
export async function GET() {
  if (process.env.NEXT_PUBLIC_PUBLIC_DATA_SOURCE === "api") return Response.json({ error: "not-found" }, { status: 404 });
  return Response.json({ profile: mockProfile, signedIn: true, requests: mockRequests, messages: mockMessages, chatSeedVersion: 2 }, { headers: { "Cache-Control": "no-store" } });
}
