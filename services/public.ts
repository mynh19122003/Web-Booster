"use client";
import { publicMockMode } from "@/lib/public-data-source";
import { mockCustomer, mockProfile, mockCoaches, mockRequests, mockMessages, mockMatchHistory, mockChampionStats } from "@/mocks/public";
import { lolChampions } from "@/data/lol-champions";
import { reviews } from "@/data/reviews";
import type { CustomerRequest, SupportMessage } from "@/lib/chat-types";

type DemoState = { profile: typeof mockProfile; signedIn: boolean; requests: CustomerRequest[]; messages: Record<string, SupportMessage[]> };
const storageKey = "ascend-public-mock-v1";
let memory: DemoState | undefined;
function state(): DemoState {
  if (memory) return memory;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (saved?.profile?.id && typeof saved.signedIn === "boolean" && Array.isArray(saved.requests) && saved.messages) return memory = saved;
  } catch { /* Continue with in-memory demo data when storage is unavailable. */ }
  return memory = structuredClone({ profile: mockProfile, signedIn: true, requests: mockRequests, messages: mockMessages });
}
function save(value: DemoState) {
  try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* Session remains usable. */ }
}
const json = (value: unknown, status = 200) => Response.json(value, { status });
function photo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** In mock mode all public requests stay in this browser; no backend fallback. */
export async function publicRequest(input: string, options: RequestInit = {}): Promise<Response> {
  if (!publicMockMode) return fetch(input, options);
  options.signal?.throwIfAborted();
  const path = input.split("?")[0];
  const method = options.method ?? "GET";
  const demo = state();
  const user = demo.signedIn ? { ...mockCustomer, name: demo.profile.name, email: demo.profile.email, avatar: demo.profile.avatar } : null;
  const body = typeof options.body === "string" ? JSON.parse(options.body) : {};
  if (path === "/api/auth/me") return json({ user });
  if (path === "/api/auth/logout") { demo.signedIn = false; save(demo); return json({ ok: true }); }
  if (path === "/api/auth/login" || path === "/api/auth/register") {
    if (typeof body.email !== "string" || !body.email.includes("@") || typeof body.password !== "string" || body.password.length < 8) return json({ error: "invalid-credentials" }, 400);
    demo.signedIn = true;
    demo.profile.email = body.email;
    if (typeof body.name === "string" && body.name.trim()) demo.profile.name = body.name.trim();
    save(demo);
    const destination = typeof body.next === "string" && body.next.startsWith("/") && !body.next.startsWith("//") ? body.next : "/profile";
    return json({ user: { ...mockCustomer, name: demo.profile.name, email: demo.profile.email }, redirectTo: destination });
  }
  if (path === "/api/coaches") return json({ coaches: mockCoaches });
  if (path.startsWith("/api/coaches/")) {
    const coach = mockCoaches.find(row => row.slug === decodeURIComponent(path.split("/")[3]));
    if (!coach) return json({ error: "not-found" }, 404);
    if (path.endsWith("/matches")) return json(coach.game === "league-of-legends" ? mockMatchHistory : { status: "unsupported", matches: [] });
    return json({ coach });
  }
  if (path === "/api/riot/coach-stats") return json(mockChampionStats);
  if (path === "/api/reviews") return json({ items: reviews });
  if (path === "/api/game-data/lol") return json({ source: "mock", champions: lolChampions });
  if (path === "/api/exchange-rate") return json({ source: "mock", usdPerEur: 1.1, date: "2026-10-12" });
  if (!user) return json({ error: "unauthorized" }, 401);
  if (path === "/api/profile/avatar") {
    if (method === "DELETE") demo.profile.avatar = null;
    else {
      const file = options.body instanceof FormData ? options.body.get("file") : null;
      if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) return json({ error: "invalid-file" }, 400);
      demo.profile.avatar = await photo(file);
    }
    options.signal?.throwIfAborted(); save(demo); return json({ profile: demo.profile });
  }
  if (path === "/api/profile") {
    if (method === "PATCH") {
      if (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.length > 80) return json({ error: "invalid-name" }, 400);
      if (body.password && (typeof body.password.newPassword !== "string" || body.password.newPassword.length < 8 || body.password.newPassword.length > 128)) return json({ error: "invalid-password" }, 400);
      if (body.password && body.password.newPassword !== body.password.confirmPassword) return json({ error: "mismatch" }, 400);
      for (const key of ["name", "phone", "country", "discord"] as const) if (typeof body[key] === "string") demo.profile[key] = body[key].trim();
      save(demo);
    }
    return json({ profile: demo.profile });
  }
  if (path === "/api/requests" || path === "/api/checkout") {
    if (method === "GET") return json({ user, requests: demo.requests });
    const checkout = path === "/api/checkout";
    if (!checkout && (typeof body.subject !== "string" || body.subject.trim().length < 3 || typeof body.text !== "string" || !body.text.trim())) return json({ error: "invalid-request" }, 400);
    const id = `DEMO-${crypto.randomUUID().slice(0, 8)}`;
    const now = Date.now();
    const request: CustomerRequest = { id, subject: checkout ? `Đơn hàng mẫu · ${body.game ?? "League of Legends"}` : body.subject.trim(), game: body.game ?? "Other", status: "assigned", customerId: user.id, customerName: user.name, employeeId: "demo-luna", employeeName: "Luna", employeeOnline: 1, updatedAt: now, lastMessage: "Đội ngũ demo đã nhận yêu cầu của bạn." };
    demo.requests.unshift(request);
    demo.messages[id] = [{ id: crypto.randomUUID(), senderId: "demo-luna", senderName: "Luna", senderRole: "employee", text: request.lastMessage, createdAt: now }];
    if (!checkout) demo.messages[id].unshift({ id: crypto.randomUUID(), senderId: user.id, senderName: user.name, senderRole: "customer", text: body.text.trim(), createdAt: now - 1 });
    // Never persist credentials or simulate a real payment in the demo service.
    save(demo); return json({ request, orderNumber: id }, 201);
  }
  if (path.startsWith("/api/requests/")) {
    const request = demo.requests.find(row => row.id === path.split("/")[3]);
    if (!request) return json({ error: "not-found" }, 404);
    if (method === "POST") {
      if (request.status === "resolved" || typeof body.text !== "string" || !body.text.trim()) return json({ error: "invalid-request" }, 400);
      const now = Date.now();
      demo.messages[request.id].push(
        { id: crypto.randomUUID(), senderId: user.id, senderName: user.name, senderRole: "customer", text: body.text.trim().slice(0, 2000), createdAt: now },
        { id: crypto.randomUUID(), senderId: "demo-luna", senderName: "Luna", senderRole: "employee", text: "Mình đã nhận tin nhắn mẫu của bạn. Bạn có thể tiếp tục thử giao diện tại đây.", createdAt: now + 1 },
      );
      request.updatedAt = now + 1; request.lastMessage = demo.messages[request.id].at(-1)!.text;
    }
    if (method === "PATCH") { request.status = body.action === "resolve" ? "resolved" : "assigned"; request.updatedAt = Date.now(); }
    save(demo); return json({ request, messages: demo.messages[request.id], orderDetails: null });
  }
  return json({ error: "mock-endpoint-unavailable" }, 501);
}
