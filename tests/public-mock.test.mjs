import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import ts from "typescript";

function loader(env = {}) {
  const modules = new Map();
  const root = resolve(import.meta.dirname, "..");
  return function load(relative) {
    const path = resolve(root, relative);
    if (modules.has(path)) return modules.get(path).exports;
    const loadedModule = { exports: {} }; modules.set(path, loadedModule);
    const require = createRequire(path);
    const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    new Function("require", "module", "exports", "process", code)(id => id.startsWith("@/") ? load(`${id.slice(2)}.ts`) : require(id), loadedModule, loadedModule.exports, { env });
    return loadedModule.exports;
  };
}

test("customer demo works without network, persists edits and threads, and excludes secrets", async () => {
  const previousStorage = globalThis.localStorage, previousFetch = globalThis.fetch;
  const stored = new Map();
  globalThis.localStorage = { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) };
  globalThis.fetch = () => { throw new Error("Unexpected backend request"); };
  try {
    const { publicRequest } = loader()("services/public.ts");
    const write = (url, body, method = "POST") => publicRequest(url, { method, body: JSON.stringify(body) });
    assert.equal((await (await publicRequest("/api/auth/me")).json()).user.name, "Minh Anh");
    assert.equal((await (await publicRequest("/api/coaches")).json()).coaches.length, 4);
    assert.equal((await (await publicRequest("/api/coaches/luna/matches")).json()).status, "ready");
    assert.equal((await publicRequest("/api/coaches/missing")).status, 404);
    assert.equal((await write("/api/profile", { name: "A" }, "PATCH")).status, 400);
    await write("/api/profile", { name: "Demo Updated", phone: "+84901234567", country: "VN", discord: "demo", password: { newPassword: "secret-demo-password", confirmPassword: "secret-demo-password" } }, "PATCH");
    const created = await (await write("/api/requests", { subject: "Demo support", game: "valorant", text: "Please help with my coaching." })).json();
    await write(`/api/requests/${created.request.id}`, { text: "A second message" });
    const detail = await (await publicRequest(`/api/requests/${created.request.id}`)).json();
    assert.equal(detail.messages.length, 4);
    assert.equal(detail.messages.at(-1).senderRole, "employee");
    const checkout = await (await write("/api/checkout", { game: "league-of-legends", order: { riotAccount: { riotPass: "riot-secret-value" } } })).json();
    assert.match(checkout.orderNumber, /^DEMO-/);
    const reloaded = loader()("services/public.ts").publicRequest;
    assert.equal((await (await reloaded("/api/profile")).json()).profile.name, "Demo Updated");
    assert.equal((await (await reloaded(`/api/requests/${created.request.id}`)).json()).messages.length, 4);
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
