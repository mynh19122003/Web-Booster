import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import ts from "typescript";

function loader(env = {}, overrides = {}) {
  const modules = new Map();
  const root = resolve(import.meta.dirname, "..");
  return function load(relative) {
    if (overrides[relative]) return overrides[relative];
    const path = resolve(root, relative);
    if (modules.has(path)) return modules.get(path).exports;
    const loadedModule = { exports: {} }; modules.set(path, loadedModule);
    const require = createRequire(path);
    const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    new Function("require", "module", "exports", "process", code)(id => id.startsWith("@/") ? id.endsWith(".json") ? require(resolve(root, id.slice(2))) : load(`${id.slice(2)}.ts`) : require(id), loadedModule, loadedModule.exports, { env });
    return loadedModule.exports;
  };
}

test("public mock initializes from the mock API once, prefers saved local data and excludes secrets", async () => {
  const previousStorage = globalThis.localStorage, previousFetch = globalThis.fetch;
  const stored = new Map();
  globalThis.localStorage = { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) };
  const mocks = loader()("mocks/public.ts");
  let calls = 0;
  globalThis.fetch = async url => { assert.equal(url, "/api/mock/public"); calls++; return Response.json({ profile: mocks.mockProfile, signedIn: true, requests: mocks.mockRequests, messages: mocks.mockMessages, chatSeedVersion: 2 }); };
  try {
    const { publicRequest } = loader({}, { "services/mock-order-flow.ts": { mockOrderCommand: async (_event, input) => ({ request: { id: `ASC-${input.submissionId}`, subject: "Rank Boost", status: "open", customerId: "demo-customer", employeeId: null }, messages: [] }) } })("services/public.ts");
    const write = (url, body, method = "POST") => publicRequest(url, { method, body: JSON.stringify(body) });
    assert.equal((await (await publicRequest("/api/auth/me")).json()).user.name, "Minh Anh");
    assert.equal((await write("/api/profile", { name: "A" }, "PATCH")).status, 400);
    await write("/api/profile", { name: "Demo Updated", phone: "+84901234567", country: "VN", discord: "demo", password: { newPassword: "secret-demo-password", confirmPassword: "secret-demo-password" } }, "PATCH");
    const created = await (await write("/api/requests", { subject: "Demo support", game: "valorant", text: "Please help with my coaching." })).json();
    assert.equal((await write(`/api/requests/${created.request.id}`, { text: "A second message" })).status, 409);
    const detail = await (await publicRequest(`/api/requests/${created.request.id}`)).json();
    assert.equal(detail.messages.length, 1);
    assert.equal(detail.request.employeeId, null);
    const checkout = await (await write("/api/checkout", { game: "league-of-legends", order: { submissionId: crypto.randomUUID(), service: "rank-boost", riotAccount: { riotPass: "riot-secret-value" } } })).json();
    assert.match(checkout.orderNumber, /^ASC-/);
    const reloaded = loader()("services/public.ts").publicRequest;
    assert.equal((await (await reloaded("/api/profile")).json()).profile.name, "Demo Updated");
    assert.equal((await (await reloaded(`/api/requests/${created.request.id}`)).json()).messages.length, 1);
    assert.equal(calls, 1);
    assert.ok(![...stored.values()].join("").includes("secret-demo-password"));
    assert.ok(![...stored.values()].join("").includes("riot-secret-value"));
    await publicRequest("/api/auth/logout", { method: "POST" });
    assert.equal((await publicRequest("/api/profile")).status, 401);
    const login = await (await write("/api/auth/login", { email: "demo@example.com", password: "12345678", next: "//example.com" })).json();
    assert.equal(login.redirectTo, "/profile");
    const controller = new AbortController(); controller.abort();
    await assert.rejects(publicRequest("/api/coaches", { signal: controller.signal }), { name: "AbortError" });
  } finally { globalThis.localStorage = previousStorage; globalThis.fetch = previousFetch; }
});

test("API mode delegates failures without returning demo data", async () => {
  const previousFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ error: "offline" }, { status: 503 }); };
  try {
    const { publicRequest } = loader({ NEXT_PUBLIC_PUBLIC_DATA_SOURCE: "api" })("services/public.ts");
    assert.equal((await publicRequest("/api/profile")).status, 503);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = previousFetch; }
});

test("mock customer UI reads shared coach snapshots from the server without substituting mock ranks", async () => {
  const previousFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async input => { requests.push(input); return Response.json({ coach: { slug: "luna", peakRank: "Gold", riotProfile: { history: { ranks: [{ leaguePoints: 78 }] } } } }); };
  try {
    const { publicRequest } = loader()("services/public.ts");
    assert.equal((await (await publicRequest("/api/coaches/luna")).json()).coach.peakRank, "Gold");
    assert.deepEqual(requests, ["/api/coaches/luna"]);
    globalThis.fetch = async () => Response.json({ error: "offline" }, { status: 503 });
    assert.equal((await publicRequest("/api/coaches/luna/matches")).status, 503);
  } finally { globalThis.fetch = previousFetch; }
});

test("employee demo login requires its password and redirects to the employee workspace", async () => {
  const previousStorage = globalThis.localStorage;
  const mocks = loader()("mocks/public.ts");
  globalThis.localStorage = { getItem: () => JSON.stringify({ profile: mocks.mockProfile, signedIn: true, requests: mocks.mockRequests, messages: mocks.mockMessages, chatSeedVersion: 2 }) };
  try {
  const { publicRequest } = loader()("services/public.ts");
  const login = password => publicRequest("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "sofia@ascend.demo", password }) });
  assert.equal((await login("incorrect-password")).status, 401);
  const result = await (await login("Ascend@123")).json();
  assert.equal(result.user.role, "employee");
  assert.equal(result.redirectTo, "/employee");
  const zero = await (await publicRequest("/api/auth/login", { method: "POST", body: JSON.stringify({ email: "zero@ascend.demo", password: "Ascend@123" }) })).json();
  assert.equal(zero.user.id, "emp-zero");
  } finally { globalThis.localStorage = previousStorage; }
});
