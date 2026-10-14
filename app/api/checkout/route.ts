import { authError, isSameOrigin } from "@/lib/auth-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return authError("invalid-request", 403);
  // No payment provider is connected. Never create a paid order locally.
  return authError("payment-unavailable", 503);
}
