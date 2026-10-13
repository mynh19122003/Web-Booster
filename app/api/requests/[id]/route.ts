import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import { employeeOrderDetails, getRequest, requestMessages, sendRequestMessage, updateRequest } from "@/lib/chat-db";
import { authError, isSameOrigin } from "@/lib/auth-http";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const user = await currentUser();
  if (!user) return authError("unauthorized", 401);
  const { id } = await context.params;
  const request = getRequest(user, id);
  if (!request) return authError("not-found", 404);
  if (user.role === "employee" && request.employeeId !== user.id) return authError("forbidden", 403);
  let orderDetails;
  try { if (user.role === "employee") orderDetails = employeeOrderDetails(user, id); }
  catch { return authError("credentials-unavailable", 503); }
  return NextResponse.json({ request, messages: requestMessages(id), ...(user.role === "employee" ? { orderDetails } : {}) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request, context: Context) {
  if (!isSameOrigin(request)) return authError("invalid-request", 403);
  const user = await currentUser();
  if (!user) return authError("unauthorized", 401);
  const { id } = await context.params;
  let body: { text?: unknown; clientId?: unknown };
  try { body = await request.json(); } catch { return authError("invalid-request", 400); }
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text || text.length > 2000) return authError("invalid-request", 400);
  if (body.clientId !== undefined && (typeof body.clientId !== "string" || !/^[a-f0-9-]{36}$/.test(body.clientId))) return authError("invalid-request", 400);
  const result = sendRequestMessage(user, id, text, body.clientId as string | undefined);
  if (result === "not-found") return authError("not-found", 404);
  if (result !== "sent") return authError("not-assigned", 409);
  return NextResponse.json({ messages: requestMessages(id) }, { status: 201 });
}

export async function PATCH(request: Request, context: Context) {
  if (!isSameOrigin(request)) return authError("invalid-request", 403);
  const user = await currentUser();
  if (!user) return authError("unauthorized", 401);
  const { id } = await context.params;
  if (!getRequest(user, id)) return authError("not-found", 404);
  let body: { action?: unknown };
  try { body = await request.json(); } catch { return authError("invalid-request", 400); }
  const action = body?.action;
  if (action !== "claim" && action !== "resolve" && action !== "reopen") return authError("invalid-request", 400);
  if ((action === "reopen" && user.role !== "customer") || (action !== "reopen" && user.role !== "employee")) return authError("forbidden", 403);
  if (!updateRequest(user, id, action)) return authError("request-changed", 409);
  return NextResponse.json({ request: getRequest(user, id) });
}
