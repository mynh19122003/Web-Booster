"use client";
import { publicMockMode } from "@/lib/public-data-source";
import { mockCustomer, mockProfile, mockRequests, mockMessages, mockChampionStats } from "@/mocks/public";
import { lolChampions } from "@/data/lol-champions";
import { reviews } from "@/data/reviews";
import type { CustomerRequest, SupportMessage } from "@/lib/chat-types";
import employeeAccounts from "@/mocks/employee-accounts.json";

type DemoState = { profile: typeof mockProfile; signedIn: boolean; requests: CustomerRequest[]; messages: Record<string, SupportMessage[]>; chatSeedVersion?: number };
const storageKey = "ascend-public-mock-v1";
let memory: DemoState | undefined;
let seeded = false;
let bootstrap: Promise<void> | undefined;
function state(): DemoState {
  if (memory) return memory;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (saved?.profile?.id && typeof saved.signedIn === "boolean" && Array.isArray(saved.requests) && saved.messages) {
      // Add new demo conversations while preserving profile edits and existing messages.
      if (!saved.chatSeedVersion) {
        for (const request of mockRequests) {
          if (!saved.requests.some((row: CustomerRequest) => row.id === request.id)) {
            saved.requests.push(structuredClone(request));
            saved.messages[request.id] = structuredClone(mockMessages[request.id]);
          }
        }
        saved.chatSeedVersion = 1;
        localStorage.setItem(storageKey, JSON.stringify(saved));
      }
      if (saved.chatSeedVersion < 2) {
        for (const request of mockRequests) {
          const existing = saved.messages[request.id];
          if (existing?.length === 2 && existing.every((message: SupportMessage) => message.id === `${request.id}-1` || message.id === `${request.id}-2`)) {
            saved.messages[request.id] = structuredClone(mockMessages[request.id]);
          }
        }
        saved.chatSeedVersion = 2;
        localStorage.setItem(storageKey, JSON.stringify(saved));
      }
      seeded = true;
      return memory = saved;
    }
  } catch { /* Continue with in-memory demo data when storage is unavailable. */ }
  return memory = structuredClone({ profile: mockProfile, signedIn: true, requests: mockRequests, messages: mockMessages, chatSeedVersion: 2 });
}
function save(value: DemoState) {
  seeded = true;
  try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* Session remains usable. */ }
}
const json = (value: unknown, status = 200) => Response.json(value, { status });
export function persistDemoChat(request: CustomerRequest, messages: SupportMessage[]) {
  if (!publicMockMode) return;
  const demo = state();
  const index = demo.requests.findIndex(row => row.id === request.id);
  if (index < 0) demo.requests.push(request);
  else demo.requests[index] = request;
  demo.messages[request.id] = messages;
  save(demo);
}
function photo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Saved data wins; the mock API supplies initial data only when storage is empty. */
export async function publicRequest(input: string, options: RequestInit = {}): Promise<Response> {
  if (!publicMockMode) return fetch(input, options);
  options.signal?.throwIfAborted();
  const path = input.split("?")[0];
  // Coach profiles use shared server data even while orders and customer accounts use mock storage.
  if (path === "/api/coaches" || path.startsWith("/api/coaches/")) return fetch(input, options);
  const method = options.method ?? "GET";
  state();
  if (!seeded) {
    bootstrap ??= fetch("/api/mock/public", { cache: "no-store" }).then(async response => {
      if (!response.ok) throw new Error("mock-data-unavailable");
      const data = await response.json() as DemoState;
      if (!data?.profile?.id || !Array.isArray(data.requests) || !data.messages) throw new Error("invalid-mock-data");
      // A concurrent socket update may already have persisted newer data.
      if (!seeded) { memory = data; save(data); }
    }).catch(error => { bootstrap = undefined; throw error; });
    await bootstrap;
  }
  const demo = state();
  const user = demo.signedIn ? { ...mockCustomer, name: demo.profile.name, email: demo.profile.email, avatar: demo.profile.avatar } : null;
  const body = typeof options.body === "string" ? JSON.parse(options.body) : {};
  if (path === "/api/auth/me") return json({ user });
  if (path === "/api/auth/logout") { demo.signedIn = false; save(demo); return json({ ok: true }); }
  if (path === "/api/auth/login" || path === "/api/auth/register") {
    const employee = typeof body.email === "string" && employeeAccounts.find(account => account.email === body.email.trim().toLowerCase());
    if (path === "/api/auth/login" && employee) {
      if (body.password !== employee.password) return json({ error: "invalid-credentials" }, 401);
      return json({ user: { id: employee.id, name: employee.name, email: employee.email, role: "employee" }, redirectTo: "/employee" });
    }
    if (typeof body.email !== "string" || !body.email.includes("@") || typeof body.password !== "string" || body.password.length < 8) return json({ error: "invalid-credentials" }, 400);
    demo.signedIn = true;
    demo.profile.email = body.email;
    if (typeof body.name === "string" && body.name.trim()) demo.profile.name = body.name.trim();
    save(demo);
    const destination = typeof body.next === "string" && body.next.startsWith("/") && !body.next.startsWith("//") ? body.next : "/profile";
    return json({ user: { ...mockCustomer, name: demo.profile.name, email: demo.profile.email }, redirectTo: destination });
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
    if (checkout) {
      try {
        if (body.order?.service === "coaching") {
          const slug = body.order?.coaching?.coachId;
          if (typeof slug !== "string") return json({ error: "invalid-request" }, 400);
          const coachResponse = await fetch(`/api/coaches/${encodeURIComponent(slug)}`, { cache: "no-store" });
          const coach = coachResponse.ok ? (await coachResponse.json()).coach : null;
          if (!coach?.online || coach.game !== body.game) return json({ error: "coach-offline" }, 409);
        }
        const { mockOrderCommand } = await import("@/services/mock-order-flow");
        const result = await mockOrderCommand("workflow:create", { ...body.order, game: body.game, amount: body.amount });
        persistDemoChat(result.request!, result.messages ?? []);
        return json({ request: result.request, orderNumber: result.request!.id }, 201);
      } catch { return json({ error: "connection" }, 503); }
    }
    if (!checkout && (typeof body.subject !== "string" || body.subject.trim().length < 3 || typeof body.text !== "string" || !body.text.trim())) return json({ error: "invalid-request" }, 400);
    const id = `DEMO-${crypto.randomUUID().slice(0, 8)}`;
    const now = Date.now();
    const request: CustomerRequest = { id, subject: body.subject.trim(), game: body.game ?? "Other", status: "open", customerId: user.id, customerName: user.name, employeeId: null, employeeName: null, employeeOnline: 0, updatedAt: now, lastMessage: "" };
    demo.requests.unshift(request);
    demo.messages[id] = [];
    if (!checkout) demo.messages[id].unshift({ id: crypto.randomUUID(), senderId: user.id, senderName: user.name, senderRole: "customer", text: body.text.trim(), createdAt: now - 1 });
    // Never persist credentials or simulate a real payment in the demo service.
    save(demo); return json({ request, orderNumber: id }, 201);
  }
  if (path.startsWith("/api/requests/")) {
    const request = demo.requests.find(row => row.id === path.split("/")[3]);
    if (!request) return json({ error: "not-found" }, 404);
    if (method === "POST") {
      if (request.status !== "assigned" || !request.employeeId || typeof body.text !== "string" || !body.text.trim()) return json({ error: "not-assigned" }, 409);
      const now = Date.now();
      demo.messages[request.id].push(
        { id: crypto.randomUUID(), senderId: user.id, senderName: user.name, senderRole: "customer", text: body.text.trim().slice(0, 2000), createdAt: now },
      );
      request.updatedAt = now + 1; request.lastMessage = demo.messages[request.id].at(-1)!.text;
    }
    if (method === "PATCH") {
      if (body.action !== "reopen" || request.status !== "resolved") return json({ error: "forbidden" }, 403);
      request.status = "open"; request.employeeId = null; request.employeeName = null; request.employeeOnline = 0; request.updatedAt = Date.now();
    }
    save(demo); return json({ request, messages: demo.messages[request.id], orderDetails: null });
  }
  return json({ error: "mock-endpoint-unavailable" }, 501);
}
