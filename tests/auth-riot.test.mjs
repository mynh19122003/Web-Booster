import assert from "node:assert/strict";
import { test, after } from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

// Run real handlers with mock state, isolated cookies, and mocked upstream HTTP.
const root = resolve(import.meta.dirname, "..");
process.env.RIOT_API_KEY = "test-key";
process.env.RIOT_RSO_CLIENT_ID = "test-client";
process.env.RIOT_RSO_CLIENT_SECRET = "test-client-secret";
process.env.RIOT_RSO_REDIRECT_URI = "http://localhost:3000/api/employee/riot/callback";
const jar = new Map();
const loaded = new Map();
function load(relative) {
  const path = resolve(root, relative);
  if (loaded.has(path)) return loaded.get(path).exports;
  const loadedModule = { exports: {} }; loaded.set(path, loadedModule);
  const require = createRequire(path);
  const scopedRequire = id => {
    if (id === "next/headers") return { cookies: async () => ({ get: name => jar.has(name) ? { value: jar.get(name) } : undefined }) };
    if (id.startsWith("@/")) return id.endsWith(".json") ? require(resolve(root, id.slice(2))) : load(`${id.slice(2)}.ts`);
    return require(id);
  };
  const javascript = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  new Function("require", "module", "exports", javascript)(scopedRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const db = load("lib/auth-db.ts");
const state = load("lib/mock-state.ts").mockState;
const redirects = load("lib/auth-redirect.ts");
const catalog = load("lib/riot-catalog.ts");
const login = load("app/api/auth/login/route.ts");
const api = load("app/api/employee/riot/route.ts");
const rso = load("lib/riot-rso.ts");
const riot = load("lib/riot-api.ts");
const historyApi = load("app/api/employee/riot/history/route.ts");
const riotId = load("lib/riot-id.ts");
const riotDisplay = load("lib/riot-display.ts");

test("employee profile rank uses the main queue and hides stale rank after a Riot failure", () => {
  const solo = { queue: "RANKED_SOLO_5x5", tier: "GOLD", division: "II", leaguePoints: 36, wins: 24, losses: 16 };
  const flex = { ...solo, queue: "RANKED_FLEX_SR", tier: "DIAMOND" };
  assert.deepEqual(riotDisplay.playerRank({ status: "ready", matches: [], ranks: [flex, solo] }, false), solo);
  assert.equal(riotDisplay.rankWinRate(solo), 60);
  assert.equal(riotDisplay.playerRank({ status: "ready", matches: [], ranks: [] }, false), null);
  assert.equal(riotDisplay.playerRank({ status: "ready", matches: [], ranks: [solo], rankError: "key-rejected" }, false), null);
});
const employee = db.createUser("Employee", "staff@example.test", "test-password");
const customer = db.createUser("Customer", "user@example.test", "test-password");
state.users.get(employee.id).role = "employee";
const employeeSession = db.createSession(employee.id);
const customerSession = db.createSession(customer.id);
const originalFetch = globalThis.fetch;
let calls = [];
let respond = () => Response.json({ ok: true });
globalThis.fetch = async (url, options) => { calls.push({ url: String(url), options, at: Date.now() }); return respond(String(url), options); };
const signIn = session => { jar.clear(); if (session) jar.set("ascend_session", session.token); };

test("chat retries persist once and request access is checked before accepting a client ID", async () => {
  const chat = load("lib/chat-db.ts");
  const requestsApi = load("app/api/requests/[id]/route.ts");
  const request = chat.createRequest(customer, "Chat delivery test", "Valorant", "Initial message");
  const context = { params: Promise.resolve({ id: request.id }) };
  const clientId = "12345678-1234-1234-1234-123456789abc";
  const post = (text, id = clientId) => new Request(`http://localhost:3000/api/requests/${request.id}`, { method: "POST", headers: { origin: "http://localhost:3000", "Content-Type": "application/json" }, body: JSON.stringify({ text, clientId: id }) });
  signIn(customerSession);
  assert.equal((await requestsApi.POST(post("Delivered once"), context)).status, 201);
  assert.equal((await requestsApi.POST(post("Delivered once"), context)).status, 201);
  assert.equal(chat.requestMessages(request.id).filter(message => message.text === "Delivered once").length, 1);
  assert.equal((await requestsApi.POST(post("Invalid key", "not-a-uuid"), context)).status, 400);
  signIn(employeeSession);
  assert.equal((await requestsApi.POST(post("Unassigned reply"), context)).status, 409);
  signIn(null);
  assert.equal((await requestsApi.POST(post("Expired session"), context)).status, 401);
});

test("API read receipts are scoped to the assigned employee and never clear newer incoming messages", async () => {
  const chat = load("lib/chat-db.ts");
  const unread = load("app/api/requests/unread/route.ts");
  const read = load("app/api/requests/[id]/read/route.ts");
  const staff = { ...employee, role: "employee" };
  const request = chat.createRequest(customer, "Unread test", "Valorant", "Initial incoming");
  const context = { params: Promise.resolve({ id: request.id }) };
  const receipt = (messageId, origin = "http://localhost:3000") => new Request(`http://localhost:3000/api/requests/${request.id}/read`, { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify({ messageId }) });
  const first = chat.requestMessages(request.id).at(-1).id;
  signIn(employeeSession);
  assert.equal((await read.POST(receipt(first), context)).status, 403);
  assert.equal(chat.updateRequest(staff, request.id, "claim"), true);
  assert.equal((await (await unread.GET()).json()).unread.byRequest[request.id], 1);
  assert.equal((await read.POST(receipt(first, "https://foreign.test"), context)).status, 403);
  assert.equal((await read.POST(receipt(first), context)).status, 200);
  chat.sendRequestMessage(customer, request.id, "New incoming");
  assert.equal((await read.POST(receipt(first), context)).status, 200);
  assert.equal((await (await unread.GET()).json()).unread.byRequest[request.id], 1);
  signIn(null);
  assert.equal((await unread.GET()).status, 401);
});

test("customer avatar persists across profile edits and password changes preserve only the active session", async () => {
  const profileApi = load("app/api/profile/route.ts");
  const avatarApi = load("app/api/profile/avatar/route.ts");
  const passwordApi = load("app/api/profile/password/route.ts");
  const user = db.createUser("Avatar User", "avatar-user@example.test", "original-password");
  const active = db.createSession(user.id), other = db.createSession(user.id);
  const origin = "http://localhost:3000";
  const request = (path, body, method = "PATCH") => new Request(`${origin}${path}`, { method, headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  signIn(null);
  assert.equal((await avatarApi.DELETE(new Request(`${origin}/api/profile/avatar`, { method: "DELETE", headers: { origin } }))).status, 401);
  signIn(active);
  const form = new FormData();
  form.set("file", new File([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX9sAAAAASUVORK5CYII=", "base64")], "avatar.png", { type: "image/png" }));
  assert.equal((await avatarApi.POST(new Request(`${origin}/api/profile/avatar`, { method: "POST", headers: { origin: "https://other.test" }, body: form }))).status, 403);
  const uploaded = await avatarApi.POST(new Request(`${origin}/api/profile/avatar`, { method: "POST", headers: { origin }, body: form }));
  assert.equal(uploaded.status, 200);
  const avatar = (await uploaded.json()).profile.avatar;
  assert.ok(avatar.startsWith("data:image/png;base64,"));
  const fake = new FormData(); fake.set("file", new File(["invalid"], "fake.png", { type: "image/png" }));
  assert.equal((await avatarApi.POST(new Request(`${origin}/api/profile/avatar`, { method: "POST", headers: { origin }, body: fake }))).status, 400);
  const details = { name: "Updated User", phone: "", country: "", discord: "" };
  const mismatch = await profileApi.PATCH(request("/api/profile", { ...details, password: { newPassword: "updated-password", confirmPassword: "different-password" } }));
  assert.equal(mismatch.status, 400);
  assert.equal((await mismatch.json()).error, "mismatch");
  assert.equal(db.verifyPassword("original-password", db.findUserByEmail(user.email).password_hash), true);
  assert.equal(db.getUserForSession(other.token).id, user.id);
  assert.equal((await profileApi.PATCH(request("/api/profile", { ...details, password: { newPassword: "updated-password" } }))).status, 400);
  const saved = await profileApi.PATCH(request("/api/profile", { ...details, password: { newPassword: "updated-password", confirmPassword: "updated-password" } }));
  assert.equal(saved.status, 200);
  assert.equal((await saved.json()).profile.avatar, avatar);
  assert.equal(db.getUserForSession(other.token), null);
  assert.equal(db.getUserForSession(active.token).id, user.id);
  assert.equal(db.verifyPassword("original-password", db.findUserByEmail(user.email).password_hash), false);
  assert.equal(db.verifyPassword("updated-password", db.findUserByEmail(user.email).password_hash), true);
  assert.equal((await login.POST(request("/api/auth/login", { email: user.email, password: "original-password" }, "POST"))).status, 401);
  assert.equal((await login.POST(request("/api/auth/login", { email: user.email, password: "updated-password" }, "POST"))).status, 200);
  assert.equal((await passwordApi.PATCH(request("/api/profile/password", { newPassword: "second-password", confirmPassword: "different-password" }))).status, 400);
  assert.equal((await passwordApi.PATCH(request("/api/profile/password", { newPassword: "short" }))).status, 400);
  assert.equal((await passwordApi.PATCH(request("/api/profile/password", { newPassword: "updated-password", confirmPassword: "updated-password" }))).status, 400);
  assert.equal((await passwordApi.PATCH(request("/api/profile/password", { newPassword: "second-password", confirmPassword: "second-password" }))).status, 200);
  const removed = await avatarApi.DELETE(new Request(`${origin}/api/profile/avatar`, { method: "DELETE", headers: { origin } }));
  assert.equal((await removed.json()).profile.avatar, null);
  assert.equal(db.getUserProfile(db.getUserForSession(active.token)).name, details.name);
  signIn(null);
});

test("checkout keeps encrypted specifications private and restricts access to the assigned employee", async () => {
  const checkout = load("app/api/checkout/route.ts");
  const requests = load("app/api/requests/route.ts");
  const thread = load("app/api/requests/[id]/route.ts");
  const { decryptOrderDetails } = load("lib/order-credentials.ts");
  const previousKey = process.env.ORDER_CREDENTIALS_KEY;
  process.env.ORDER_CREDENTIALS_KEY = "11".repeat(32);
  const otherCustomer = db.createUser("Other customer", "other-customer@example.test", "test-password");
  const otherEmployee = db.createUser("Other employee", "other-employee@example.test", "test-password");
  state.users.get(otherEmployee.id).role = "employee";
  const otherCustomerSession = db.createSession(otherCustomer.id);
  const otherEmployeeSession = db.createSession(otherEmployee.id);
  const order = {
    submissionId: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa", service: "rank-boost",
    currentRank: "Silver IV", targetRank: "Gold IV", region: "VN", queue: "Solo / Duo",
    role: "Mid", championPool: "Ahri, Lux", flashSlot: "F", customerNotes: "Private playstyle instructions",
    riotAccount: { riotUsername: "private-riot-login", riotPass: " secret-riot-password ", riotIdTag: "Player#VN1" },
  };
  // Solo / Duo is the standard ranked queue and still requires credentials for a solo service.
  const post = (value = order, origin = "http://localhost:3000") => new Request("http://localhost:3000/api/checkout", {
    method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify({ game: "league-of-legends", order: value }),
  });
  const context = id => ({ params: Promise.resolve({ id }) });
  const mutation = (id, method, value) => new Request(`http://localhost:3000/api/requests/${id}`, {
    method, headers: { origin: "http://localhost:3000", "Content-Type": "application/json" }, body: JSON.stringify(value),
  });
  try {
    signIn(null);
    assert.equal((await checkout.POST(post())).status, 401);
    signIn(employeeSession);
    assert.equal((await checkout.POST(post())).status, 403);
    signIn(customerSession);
    assert.equal((await checkout.POST(post(order, "https://evil.test"))).status, 403);
    for (const invalid of [null, [], { ...order, flashSlot: "Q" }, { ...order, targetRank: "" }, { ...order, submissionId: "bad" },
      { ...order, riotAccount: null }, { ...order, riotAccount: { ...order.riotAccount, riotIdTag: "missing-tag" } },
      { ...order, riotAccount: { ...order.riotAccount, riotPass: " " } }, { ...order, customerNotes: "x".repeat(2001) }]) {
      assert.equal((await checkout.POST(post(invalid))).status, 400);
    }
    const created = await checkout.POST(post());
    assert.equal(created.status, 201);
    assert.equal(created.headers.get("cache-control"), "no-store");
    const { request, orderNumber } = await created.json();
    const repeated = await (await checkout.POST(post())).json();
    assert.equal(repeated.request.id, request.id);
    assert.equal(repeated.orderNumber, orderNumber);
    const rows = [...state.orderDetails.values()].filter(row => row.customerId === customer.id && row.submissionId === order.submissionId);
    assert.equal(rows.length, 1);
    const encrypted = rows[0].encrypted;
    for (const secret of [order.riotAccount.riotUsername, order.riotAccount.riotPass, order.customerNotes, order.championPool]) assert.ok(!encrypted.includes(secret));
    assert.equal(decryptOrderDetails(request.id, encrypted).riotAccount.riotPass, order.riotAccount.riotPass);
    assert.throws(() => decryptOrderDetails("wrong-request", encrypted));
    assert.throws(() => decryptOrderDetails(request.id, encrypted.slice(0, -8) + "AAAAAAAA"));
    const get = () => thread.GET(new Request(`http://localhost:3000/api/requests/${request.id}`), context(request.id));
    const customerView = await (await get()).json();
    assert.ok(!Object.hasOwn(customerView, "orderDetails"));
    for (const secret of [order.riotAccount.riotUsername, order.riotAccount.riotPass, order.customerNotes, order.championPool]) {
      assert.ok(!JSON.stringify(customerView).includes(secret));
      assert.ok(!JSON.stringify(await (await requests.GET()).json()).includes(secret));
    }
    assert.equal((await thread.PATCH(mutation(request.id, "PATCH", { action: "claim" }), context(request.id))).status, 403);
    signIn(otherCustomerSession);
    assert.equal((await get()).status, 404);
    signIn(employeeSession);
    assert.equal((await get()).status, 403);
    assert.equal((await thread.PATCH(mutation(request.id, "PATCH", { action: "claim" }), context(request.id))).status, 200);
    const employeeView = await (await get()).json();
    assert.equal(employeeView.orderDetails.riotAccount.riotPass, order.riotAccount.riotPass);
    assert.equal(employeeView.orderDetails.flashSlot, "F");
    assert.equal(employeeView.orderDetails.orderNumber, orderNumber);
    signIn(otherEmployeeSession);
    assert.equal((await get()).status, 403);
    assert.equal((await thread.POST(mutation(request.id, "POST", { text: "Forbidden reply" }), context(request.id))).status, 409);
    signIn(employeeSession);
    assert.equal((await thread.POST(mutation(request.id, "POST", { text: "Ready to start" }), context(request.id))).status, 201);
    signIn(customerSession);
    assert.equal((await thread.POST(mutation(request.id, "POST", { text: "Thank you" }), context(request.id))).status, 201);
    assert.ok((await (await get()).json()).messages.some(message => message.text === "Ready to start"));
    signIn(employeeSession);
    assert.equal((await thread.PATCH(mutation(request.id, "PATCH", { action: "resolve" }), context(request.id))).status, 200);
    signIn(customerSession);
    assert.equal((await thread.PATCH(mutation(request.id, "PATCH", { action: "reopen" }), context(request.id))).status, 200);
    signIn(employeeSession);
    assert.equal((await get()).status, 403);
    signIn(customerSession);
    const duo = await checkout.POST(post({ ...order, submissionId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb", service: "duo-boost", queue: "Duo", riotAccount: null }));
    assert.equal(duo.status, 201);
    assert.equal((await checkout.POST(post({ ...order, service: "duo-boost" }))).status, 400);
  } finally {
    if (previousKey === undefined) delete process.env.ORDER_CREDENTIALS_KEY; else process.env.ORDER_CREDENTIALS_KEY = previousKey;
    signIn(null);
  }
});

test("preview checkout uses an in-memory encryption key when none is configured", async () => {
  const checkout = load("app/api/checkout/route.ts");
  const previousKey = process.env.ORDER_CREDENTIALS_KEY;
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  signIn(customerSession);
  const before = state.requests.size;
  const order = { submissionId: "cccccccc-cccc-4ccc-cccc-cccccccccccc", service: "rank-boost", currentRank: "Silver IV", targetRank: "Gold IV",
    region: "VN", queue: "Solo", role: "Mid", championPool: "", flashSlot: "D", customerNotes: "",
    riotAccount: { riotUsername: "riot-user", riotPass: "riot-password", riotIdTag: "Player#VN1" } };
  try {
    delete process.env.ORDER_CREDENTIALS_KEY;
    const response = await checkout.POST(new Request("http://localhost:3000/api/checkout", { method: "POST",
      headers: { origin: "http://localhost:3000", "Content-Type": "application/json" }, body: JSON.stringify({ game: "league-of-legends", order }) }));
    assert.equal(response.status, 201);
    assert.equal(state.requests.size, before + 1);
  } finally {
    if (previousKey === undefined) delete process.env.ORDER_CREDENTIALS_KEY; else process.env.ORDER_CREDENTIALS_KEY = previousKey;
    if (previousEnvironment === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousEnvironment;
    signIn(null);
  }
});

test("offline coach is visible to customers and coaching checkout cannot create an order", async () => {
  const checkout = load("app/api/checkout/route.ts");
  const presence = load("app/api/mock/coach-presence/route.ts");
  const profiles = load("lib/coach-profile-db.ts");
  const publicProfile = load("app/api/coaches/[slug]/route.ts");
  const previous = profiles.coachProfileOverride("luna");
  const previousKey = process.env.ORDER_CREDENTIALS_KEY;
  const body = {
    submissionId: "dddddddd-dddd-4ddd-dddd-dddddddddddd", service: "coaching",
    currentRank: "Challenger", targetRank: "Coaching session", region: "EUW", queue: "Coaching",
    role: "", championPool: "", flashSlot: "no-preference", customerNotes: "", riotAccount: null,
    coaching: { coachId: "luna", coachName: "Luna", quantity: 1, sessionFormat: "live" },
  };
  const request = () => new Request("http://localhost:3000/api/checkout", {
    method: "POST", headers: { origin: "http://localhost:3000", "Content-Type": "application/json" },
    body: JSON.stringify({ game: "league-of-legends", order: body }),
  });
  const toggle = (password, isOnline) => new Request("http://localhost:3000/api/mock/coach-presence", {
    method: "PATCH", headers: { origin: "http://localhost:3000", "Content-Type": "application/json" },
    body: JSON.stringify({ employeeId: "emp-luna", password, isOnline }),
  });
  try {
    process.env.ORDER_CREDENTIALS_KEY = "11".repeat(32);
    signIn(customerSession);
    assert.equal((await presence.PATCH(toggle("wrong-password", false))).status, 400);
    assert.equal((await presence.PATCH(toggle("Ascend@123", false))).status, 200);
    assert.equal((await (await publicProfile.GET(new Request("http://localhost:3000/api/coaches/luna"), { params: Promise.resolve({ slug: "luna" }) })).json()).coach.online, false);
    const before = state.requests.size;
    const blocked = await checkout.POST(request());
    assert.equal(blocked.status, 409);
    assert.deepEqual(await blocked.json(), { error: "coach-offline" });
    assert.equal(state.requests.size, before);
    assert.equal((await presence.PATCH(toggle("Ascend@123", true))).status, 200);
    assert.equal((await checkout.POST(request())).status, 201);
  } finally {
    if (previous) profiles.saveCoachProfile("luna", { online: previous.online });
    else profiles.resetCoachProfile("luna");
    if (previousKey === undefined) delete process.env.ORDER_CREDENTIALS_KEY;
    else process.env.ORDER_CREDENTIALS_KEY = previousKey;
    signIn(null);
  }
});

test("employee header status enforces session, origin and persists coach availability", async () => {
  const status = load("app/api/employee/status/route.ts");
  const ownership = load("lib/coach-ownership.ts");
  const profiles = load("lib/coach-profile-db.ts");
  ownership.coachAccess({ ...employee, role: "employee" });
  assert.equal(ownership.assignCoach(employee.id, "luna"), true);
  const request = (body, origin = "http://localhost:3000") => new Request("http://localhost:3000/api/employee/status", { method: "PATCH", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  signIn(null);
  assert.equal((await status.PATCH(request({ isOnline: true }))).status, 401);
  signIn(customerSession);
  assert.equal((await status.PATCH(request({ isOnline: true }))).status, 403);
  signIn(employeeSession);
  assert.equal((await status.PATCH(request({ isOnline: true }, "https://evil.test"))).status, 403);
  assert.equal((await status.PATCH(request({ isOnline: "true" }))).status, 400);
  const coach = ownership.managedCoachBases({ ...employee, role: "employee" })[0];
  const previous = profiles.coachProfileOverride(coach.slug);
  try {
    for (const isOnline of [false, true]) {
      assert.deepEqual(await (await status.PATCH(request({ isOnline }))).json(), { success: true, isOnline });
      assert.equal(profiles.getCoachWithOverride(coach.slug).online, isOnline);
      assert.equal((await (await status.GET()).json()).isOnline, isOnline);
    }
    state.employeeCoaches.delete(employee.id);
    assert.equal((await status.PATCH(request({ isOnline: false, slug: coach.slug }))).status, 200);
    assert.equal((await (await status.GET()).json()).isOnline, false);
    assert.equal(profiles.getCoachWithOverride(coach.slug).online, true);
  } finally {
    if (previous) profiles.saveCoachProfile(coach.slug, previous);
    else profiles.resetCoachProfile(coach.slug);
    state.coachAccess.delete(employee.id);
    state.employeeCoaches.delete(employee.id);
    state.presence.delete(employee.id);
    signIn(null);
  }
});
const query = values => new Request(`http://localhost:3000/api/employee/riot?${new URLSearchParams(values)}`);
after(() => {
  globalThis.fetch = originalFetch;
});

test("database role controls login from either login form and overrides employee next", async () => {
  for (const audience of ["employee", "customer"]) {
    for (const [email, redirectTo] of [["staff@example.test", "/employee"], ["user@example.test", "/"]]) {
      const response = await login.POST(new Request("http://localhost:3000/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: "test-password", audience, next: "/employee/coaches", role: "employee" }) }));
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.redirectTo, redirectTo);
      assert.equal(body.user.role, email.startsWith("staff") ? "employee" : "customer");
      assert.match(response.headers.get("set-cookie"), /HttpOnly/);
    }
  }
});
test("user alias, customer return paths and unsafe redirect inputs", () => {
  assert.equal(redirects.loginDestination("user"), "/");
  assert.equal(redirects.loginDestination("customer", "/checkout?order=1"), "/checkout?order=1");
  for (const path of ["https://evil.test", "//evil.test", "/\\evil.test", "/%5cevil.test", "/api/auth/logout", "/login", "/employee", "/%65mployee/riot", "/admin", "/foo/../employee"]) assert.equal(redirects.loginDestination("user", path), "/", path);
  assert.equal(redirects.loginDestination("employee", "/checkout"), "/employee");
});
test("Google OAuth uses database role and preserves customer return paths", async () => {
  const callback = load("app/api/auth/google/callback/route.ts");
  process.env.GOOGLE_CLIENT_ID = "test-google-client";
  process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";
  for (const role of ["employee", "customer"]) {
    const subject = `google-${role}`;
    const user = db.createGoogleUser("Google Test", `${subject}@example.test`, subject);
    state.users.get(user.id).role = role;
    jar.clear(); jar.set("ascend_oauth_state", "valid-state"); jar.set("ascend_oauth_verifier", "test-verifier"); jar.set("ascend_oauth_next", "/checkout");
    respond = url => Response.json(url.includes("/token") ? { access_token: "test-google-token" } : { sub: subject, email: `${subject}@example.test`, email_verified: true });
    const response = await callback.GET(new Request("http://localhost:3000/api/auth/google/callback?code=test-code&state=valid-state"));
    assert.equal(response.headers.get("location"), `http://localhost:3000${role === "employee" ? "/employee" : "/checkout"}`);
    assert.match(response.headers.get("set-cookie"), /ascend_session=/);
  }
});
test("Riot catalog is employee only and does not expose tokens", async () => {
  signIn(null); assert.equal((await api.GET(query({}))).status, 401);
  signIn(customerSession); assert.equal((await api.GET(query({}))).status, 403);
  signIn(employeeSession);
  const response = await api.GET(query({}));
  const body = await response.json();
  assert.equal(body.endpoints.length, 65);
  assert.equal(new Set(body.endpoints.map(endpoint => endpoint.group)).size, 25);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.ok(!JSON.stringify(body).includes("test-key"));
});
test("allowlist rejects URL injection, foreign regions and invalid pagination before HTTP", async () => {
  signIn(employeeSession); calls = [];
  const base = { endpoint: "match-v5.getMatchIdsByPUUID", game: "lol", region: "asia", puuid: "player" };
  for (const overrides of [{ endpoint: "https://evil.test" }, { region: "evil.test" }, { game: "valorant" }, { count: "101" }, { count: "-1" }, { count: "oops" }, { puuid: ".." }, { api_key: "override" }]) assert.equal((await api.GET(query({ ...base, ...overrides }))).status, 400);
  assert.equal(calls.length, 0);
  const endpoint = catalog.riotEndpoints.find(endpoint => endpoint.id === "account-v1.getByRiotId");
  assert.match(catalog.buildRiotRequest(endpoint, "lol", "asia", { gameName: "A/B", tagLine: "VN?x" }), /A%2FB\/VN%3Fx$/);
});
test("official console platform and queue enums are accepted and invalid values rejected", () => {
  const endpoint = catalog.riotEndpoints.find(endpoint => endpoint.id === "val-console-match-v1.getMatchlist");
  assert.deepEqual(endpoint.query[0].choices, ["playstation", "xbox"]);
  assert.match(catalog.buildRiotRequest(endpoint, "valorant", "ap", { puuid: "player", platformType: "xbox" }), /platformType=xbox$/);
  assert.throws(() => catalog.buildRiotRequest(endpoint, "valorant", "ap", { puuid: "player", platformType: "XBOX" }));
  const match = catalog.riotEndpoints.find(endpoint => endpoint.id === "match-v5.getMatchIdsByPUUID");
  assert.match(catalog.buildRiotRequest(match, "lol", "asia", { puuid: "player", count: "0" }), /count=0$/);
});
test("LoL active region, TFT matches and Valorant content use correct hosts and API headers", async () => {
  signIn(employeeSession); calls = [];
  respond = () => Response.json({ value: "fixture" });
  const requests = [
    [{ endpoint: "account-v1.getActiveRegion", game: "lol", region: "asia", puuid: "region-player" }, "https://asia.api.riotgames.com/riot/account/v1/region/by-game/lol/by-puuid/region-player"],
    [{ endpoint: "tft-match-v1.getMatchIdsByPUUID", game: "tft", region: "sea", puuid: "tft-player", count: "10" }, "https://sea.api.riotgames.com/tft/match/v1/matches/by-puuid/tft-player/ids?count=10"],
    [{ endpoint: "val-content-v1.getContent", game: "valorant", region: "ap", locale: "vi-VN" }, "https://ap.api.riotgames.com/val/content/v1/contents?locale=vi-VN"],
  ];
  for (const [parameters, expectedUrl] of requests) {
    assert.equal((await api.GET(query(parameters))).status, 200);
    assert.equal(calls.at(-1).url, expectedUrl);
    assert.equal(calls.at(-1).options.headers["X-Riot-Token"], "test-key");
    assert.equal(calls.at(-1).options.redirect, "error");
  }
  const count = calls.length;
  await api.GET(query(requests[0][0])); assert.equal(calls.length, count, "repeat is cached");
});
test("RSO token is encrypted, bound to employee and sent as Bearer only", async () => {
  signIn(employeeSession);
  const { NextResponse } = createRequire(import.meta.url)("next/server");
  const response = NextResponse.json({});
  rso.setRiotConnection(response, { userId: employee.id, puuid: "rso-player", gameName: "Test", tagLine: "VN", accessToken: "private-riot-token", expiresAt: Date.now() + 60_000 });
  const value = response.cookies.get("ascend_riot_connection").value;
  assert.ok(!value.includes("private-riot-token"));
  jar.set("ascend_riot_connection", value);
  assert.equal((await rso.riotConnection(employee.id)).puuid, "rso-player");
  assert.equal(await rso.riotConnection(customer.id), null);
  respond = () => Response.json({ puuid: "rso-player" });
  await api.GET(query({ endpoint: "account-v1.getByAccessToken", game: "lol", region: "asia" }));
  assert.equal(calls.at(-1).options.headers.Authorization, "Bearer private-riot-token");
  assert.equal(calls.at(-1).options.headers["X-Riot-Token"], undefined);
  const body = await (await api.GET(query({}))).json();
  assert.ok(!JSON.stringify(body).includes("private-riot-token"));
});
test("Riot OAuth verifies state, exchanges code and creates the employee connection", async () => {
  signIn(employeeSession); calls = [];
  const callback = load("app/api/employee/riot/callback/route.ts");
  jar.set("ascend_riot_state", `${employee.id}.expected-state`);
  const failed = await callback.GET(new Request("http://localhost:3000/api/employee/riot/callback?code=test&state=wrong-state"));
  assert.match(failed.headers.get("location"), /connection=failed$/);
  assert.equal(calls.length, 0);
  respond = url => Response.json(url.includes("/token") ? { access_token: "oauth-riot-token", expires_in: 600 } : { puuid: "oauth-player", gameName: "Connected", tagLine: "VN" });
  const response = await callback.GET(new Request("http://localhost:3000/api/employee/riot/callback?code=test&state=expected-state"));
  assert.match(response.headers.get("location"), /connection=connected$/);
  assert.equal(calls[0].url, "https://auth.riotgames.com/token");
  assert.match(calls[0].options.headers.Authorization, /^Basic /);
  jar.set("ascend_riot_connection", response.cookies.get("ascend_riot_connection").value);
  assert.equal((await rso.riotConnection(employee.id)).puuid, "oauth-player");
});
test("Valorant player data requires consent and refuses another player's PUUID and matches", async () => {
  signIn(employeeSession);
  const own = { endpoint: "val-match-v1.getMatchlist", game: "valorant", region: "ap", puuid: "rso-player" };
  assert.equal((await api.GET(query(own))).status, 403);
  const { NextResponse } = createRequire(import.meta.url)("next/server");
  const response = NextResponse.json({});
  rso.setRiotConnection(response, { userId: employee.id, puuid: "rso-player", gameName: "Test", tagLine: "VN", accessToken: "private-riot-token", expiresAt: Date.now() + 60_000 });
  jar.set("ascend_riot_connection", response.cookies.get("ascend_riot_connection").value);
  assert.equal((await api.GET(query({ ...own, puuid: "someone-else" }))).status, 403);
  respond = () => Response.json({ history: [] });
  assert.equal((await api.GET(query(own))).status, 200);
  respond = () => Response.json({ players: [{ puuid: "someone-else" }] });
  assert.equal((await api.GET(query({ endpoint: "val-match-v1.getMatch", game: "valorant", region: "ap", matchId: "private-match" }))).status, 403);
});
test("coach account verification calls active region before the game's summoner", async () => {
  globalThis.riotState.requests = [];
  calls = [];
  respond = url => Response.json(url.includes("by-riot-id") ? { puuid: "coach-player", gameName: "Coach", tagLine: "VN" } : url.includes("/region/") ? { region: "VN2" } : { puuid: "coach-player" });
  const account = await riot.resolveRiotAccount("Coach", "VN", "euw1", true);
  assert.equal(account.platform, "vn2");
  assert.match(calls[1].url, /region\/by-game\/tft\/by-puuid\/coach-player$/);
  assert.match(calls[2].url, /vn2\.api\.riotgames\.com\/tft\/summoner\/v1/);
});
test("TFT coach match history routes SEA matches to the cluster in the official catalog", async () => {
  calls = [];
  respond = url => Response.json(url.includes("/league/") ? [] : url.includes("/ids?") ? ["VN2_match"] : { metadata: { match_id: "VN2_match" }, info: { participants: [{ puuid: "sea-player", placement: 2, level: 8 }], game_length: 1800, game_datetime: 1_700_000_000_000, queue_id: 1100 } });
  const history = await riot.riotMatchHistory({ puuid: "sea-player", gameName: "SEA", tagLine: "VN", platform: "vn2" }, true);
  assert.equal(history.status, "ready");
  assert.equal(history.matches[0].placement, 2);
  assert.ok(calls.filter(call => call.url.includes("/match/")).every(call => call.url.startsWith("https://sea.api.riotgames.com/")));
  assert.match(calls.at(-1).url, /vn2\.api\.riotgames\.com\/tft\/league\/v1\/by-puuid\/sea-player$/);
});
function historyRequest(body, origin = "http://localhost:3000") {
  return new Request("http://localhost:3000/api/employee/riot/history", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

test("Name#Tag parser trims spaces and rejects ambiguous or unsafe Riot IDs", () => {
  assert.deepEqual(riotId.parseRiotId(" BLG Lucyiu # BLG "), { gameName: "BLG Lucyiu", tagLine: "BLG" });
  for (const value of [null, {}, "Name", "#Tag", "Name#", "Name#Tag#More", "Name\n#Tag", "..#Tag", "Name#..", `${"A".repeat(101)}#TAG`]) assert.equal(riotId.parseRiotId(value), null);
});

test("match lookup requires employee, same origin and valid game, server and Riot ID", async () => {
  calls = [];
  const valid = { riotId: "Player#VN", game: "lol", platform: "vn2" };
  signIn(null); assert.equal((await historyApi.POST(historyRequest(valid))).status, 401);
  signIn(customerSession); assert.equal((await historyApi.POST(historyRequest(valid))).status, 403);
  signIn(employeeSession);
  assert.equal((await historyApi.POST(historyRequest(valid, "https://evil.test"))).status, 403);
  for (const body of [null, [], { ...valid, riotId: "bad" }, { ...valid, game: "valorant" }, { ...valid, platform: "evil.test" }]) assert.equal((await historyApi.POST(historyRequest(body))).status, 400);
  assert.equal(calls.length, 0);
});

test("Name#Tag lookup resolves active server, shows own LoL matches and does not save a coach link", async () => {
  signIn(employeeSession); calls = []; globalThis.riotState.requests = [];
  const coachAccounts = load("lib/coach-riot-db.ts");
  coachAccounts.coachRiotAccount("luna");
  const countBefore = state.coachRiotAccounts.size;
  respond = url => Response.json(url.includes("/by-riot-id/") ? { gameName: "BLG Lucyiu", tagLine: "BLG", puuid: "lookup-lol-player" }
    : url.includes("/region/by-game/") ? { region: "VN2" }
    : url.includes("/summoners/") ? { puuid: "lookup-lol-player" }
    : url.includes("/league/") ? [{ queueType: "RANKED_SOLO_5x5", tier: "MASTER", rank: "I", leaguePoints: 120, wins: 84, losses: 73 }]
    : url.includes("/ids?") ? ["VN2_lookup_match"]
    : { metadata: { matchId: "VN2_lookup_match" }, info: { participants: [
      { puuid: "someone-else", championName: "Lux", win: false, kills: 0 },
      { puuid: "lookup-lol-player", championName: "Ahri", win: true, kills: 12, deaths: 2, assists: 8, teamPosition: "MIDDLE", champLevel: 14, totalMinionsKilled: 150, neutralMinionsKilled: 25, goldEarned: 10718, totalDamageDealtToChampions: 7931, item0: 3152, item1: 3020, item2: 3089, item6: 3364 },
    ], queueId: 420, gameMode: "CLASSIC", gameDuration: 1800, gameEndTimestamp: 1_700_000_000_000 } });
  const response = await historyApi.POST(historyRequest({ riotId: " BLG Lucyiu # BLG ", game: "lol", platform: "na1" }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = await response.json();
  assert.equal(body.status, "ready"); assert.equal(body.account.platform, "vn2");
  assert.equal(body.matches[0].kills, 12); assert.equal(body.matches[0].won, true);
  assert.equal(body.matches[0].championId, "Ahri");
  assert.equal(body.matches[0].cs, 175); assert.equal(body.matches[0].level, 14);
  assert.equal(body.matches[0].gold, 10718); assert.equal(body.matches[0].damage, 7931);
  assert.deepEqual(body.matches[0].items, [3152, 3020, 3089, 0, 0, 0, 3364]);
  assert.equal(body.ranks[0].leaguePoints, 120); assert.equal(riotDisplay.rankWinRate(body.ranks[0]), 54);
  assert.match(calls[0].url, /by-riot-id\/BLG%20Lucyiu\/BLG$/);
  assert.ok(calls.some(call => /sea\.api\.riotgames\.com\/lol\/match\/v5\/matches\/VN2_lookup_match$/.test(call.url)));
  assert.match(calls.at(-1).url, /vn2\.api\.riotgames\.com\/lol\/league\/v4\/entries\/by-puuid\/lookup-lol-player$/);
  assert.ok(calls.some(call => call.url.endsWith("/ids?start=0&count=20")));
  assert.ok(!JSON.stringify(body).includes("lookup-lol-player"));
  assert.ok(!JSON.stringify(body).includes("test-key"));
  assert.equal(state.coachRiotAccounts.size, countBefore);
});

test("TFT Name#Tag lookup renders placement and a separate request returns empty history", async () => {
  signIn(employeeSession); calls = []; globalThis.riotState.requests = [];
  let empty = false;
  respond = url => Response.json(url.includes("/by-riot-id/") ? { gameName: "TFT Player", tagLine: "VN", puuid: empty ? "lookup-empty" : "lookup-tft" }
    : url.includes("/region/by-game/") ? { region: "VN2" }
    : url.includes("/summoners/") ? { puuid: "lookup-tft" }
    : url.includes("/league/") ? []
    : url.includes("/ids?") ? empty ? [] : ["VN2_tft_lookup"]
    : { metadata: { match_id: "VN2_tft_lookup" }, info: { participants: [{ puuid: "lookup-tft", placement: 1, level: 9 }], game_length: 1800, game_datetime: 1_700_000_000_000, queue_id: 1100 } });
  const body = await (await historyApi.POST(historyRequest({ riotId: "TFT Player#VN", game: "tft", platform: "vn2" }))).json();
  assert.equal(body.status, "ready"); assert.equal(body.matches[0].placement, 1);
  assert.ok(calls.some(call => call.url.includes("region/by-game/tft/")));
  assert.ok(calls.some(call => /sea\.api\.riotgames\.com\/tft\/match\/v1/.test(call.url)));
  assert.deepEqual(body.ranks, []);
  empty = true;
  const noMatches = await (await historyApi.POST(historyRequest({ riotId: "TFT Player#VN", game: "tft", platform: "vn2" }))).json();
  assert.equal(noMatches.status, "ready"); assert.deepEqual(noMatches.matches, []);
});

test("invalid Riot key is surfaced by Name#Tag lookup without exposing credentials", async () => {
  signIn(employeeSession); calls = []; globalThis.riotState.requests = [];
  respond = () => new Response(null, { status: 401 });
  const response = await historyApi.POST(historyRequest({ riotId: "Player#VN", game: "lol", platform: "vn2" }));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("retry-after"), "0");
  assert.deepEqual(await response.json(), { error: "key-rejected", retryAfter: 0 });
  assert.equal(calls.length, 1);
});

test("preview employee Riot lookup authenticates fixed accounts, fetches fresh ranks and is disabled in API mode", async () => {
  const originalMode = process.env.NEXT_PUBLIC_PUBLIC_DATA_SOURCE;
  signIn(null); calls = []; globalThis.riotState.requests = []; globalThis.riotState.blockedUntil = 0;
  const account = { id: "emp-luna", email: "luna@ascend.demo", password: "Ascend@123" };
  const input = { riotId: "Fresh Player#KR1", game: "lol", platform: "kr", employee: account };
  let points = 25;
  respond = url => Response.json(url.includes("/by-riot-id/") ? { gameName: "Fresh Player", tagLine: "KR1", puuid: "fresh-profile-player" }
    : url.includes("/region/by-game/") ? { region: "KR" }
    : url.includes("/summoners/") ? { puuid: "fresh-profile-player" }
    : url.includes("/league/") ? [{ queueType: "RANKED_SOLO_5x5", tier: "GOLD", rank: "II", leaguePoints: points, wins: 24, losses: 16 }]
    : []);
  try {
    process.env.NEXT_PUBLIC_PUBLIC_DATA_SOURCE = "mock";
    assert.equal((await historyApi.POST(historyRequest({ ...input, employee: { ...account, password: "wrong" } }))).status, 401);
    assert.equal((await historyApi.POST(historyRequest(input, "https://evil.test"))).status, 403);
    assert.equal(calls.length, 0);
    let response = await historyApi.POST(historyRequest(input));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ranks[0].leaguePoints, 25);
    const proxied = new Request("http://localhost:3000/api/employee/riot/history", { method: "POST", headers: { origin: "http://127.0.0.1:3102", host: "127.0.0.1:3102", "Content-Type": "application/json" }, body: JSON.stringify(input) });
    assert.equal((await historyApi.POST(proxied)).status, 200);
    points = 78;
    response = await historyApi.POST(historyRequest(input));
    assert.equal((await response.json()).ranks[0].leaguePoints, 78);
    globalThis.riotState.requests = [];
    response = await historyApi.POST(historyRequest({ ...input, publishProfile: true, slug: "someone-elses-coach" }));
    assert.equal(response.status, 200);
    const profileStore = load("lib/coach-riot-profile.ts");
    assert.equal(profileStore.coachRiotProfile("luna").employeeId, "emp-luna");
    assert.equal(profileStore.coachRiotProfile("someone-elses-coach"), null);
    const publicCoach = load("lib/coach-profile-db.ts").getCoachWithOverride("luna");
    assert.equal(publicCoach.peakRank, "Gold");
    assert.equal(publicCoach.server, "KR");
    assert.equal(publicCoach.riotProfile.history.ranks[0].leaguePoints, 78);
    assert.equal(publicCoach.riotProfile.history.ranks[0].wins, 24);
    const count = calls.length;
    process.env.NEXT_PUBLIC_PUBLIC_DATA_SOURCE = "api";
    assert.equal((await historyApi.POST(historyRequest(input))).status, 401);
    assert.equal(calls.length, count);
  } finally {
    state.coachRiotProfiles.delete("luna");
    if (originalMode === undefined) delete process.env.NEXT_PUBLIC_PUBLIC_DATA_SOURCE;
    else process.env.NEXT_PUBLIC_PUBLIC_DATA_SOURCE = originalMode;
    signIn(employeeSession);
  }
});

test("20 matches are paced within the request budget and subsequent reads reuse the full result", async () => {
  calls = []; globalThis.riotState.requests = [];
  respond = url => Response.json(url.includes("/league/") ? [] : url.includes("/ids?") ? Array.from({ length: 20 }, (_, index) => `VN2_full_${index}`)
    : { metadata: { matchId: url.split("/").at(-1) }, info: { participants: [{ puuid: "full-history", championName: "Viego", win: true, kills: 5, deaths: 9, assists: 6 }], queueId: 420, gameDuration: 1744, gameEndTimestamp: 1_700_000_000_000 } });
  const account = { puuid: "full-history", gameName: "History", tagLine: "VN", platform: "vn2" };
  const [first, concurrent] = await Promise.all([riot.riotMatchHistory(account, false), riot.riotMatchHistory(account, false)]);
  assert.equal(first.matches.length, 20); assert.deepEqual(first, concurrent);
  assert.equal(calls.length, 22);
  assert.ok(calls.every(call => calls.filter(other => other.at >= call.at && other.at - call.at < 1000).length <= 18));
  assert.deepEqual(await riot.riotMatchHistory(account, false), first); assert.equal(calls.length, 22);
  calls = []; globalThis.riotState.requests = [];
  respond = url => Response.json(url.includes("/league/") ? [] : []);
  const fresh = await riot.riotMatchHistory(account, false, true);
  assert.equal(fresh.matches.length, 0);
  assert.equal(calls.length, 2);
  assert.equal(riot.cachedRiotMatchHistory(account, false).matches.length, 0);
});

test("rank failure preserves real match history and is not reported as unranked", async () => {
  calls = []; globalThis.riotState.requests = [];
  respond = url => url.includes("/league/") ? new Response(null, { status: 403 }) : Response.json(url.includes("/ids?") ? ["VN2_rank_error"]
    : { metadata: { matchId: "VN2_rank_error" }, info: { participants: [{ puuid: "rank-error-player", championName: "Lux", win: false }], queueId: 450, gameDuration: 1500, gameEndTimestamp: 1_700_000_000_000 } });
  const history = await riot.riotMatchHistory({ puuid: "rank-error-player", gameName: "History", tagLine: "VN", platform: "vn2" }, false);
  assert.equal(history.status, "ready"); assert.equal(history.matches.length, 1);
  assert.equal(history.rankError, "key-rejected"); assert.equal(history.ranks, undefined);
});

test("mode filters use queue IDs and rank selection uses the appropriate queue", () => {
  const sample = [420, 440, 490, 450, 1100, 1090, 1160].map(queueId => ({ queueId }));
  assert.deepEqual(riotDisplay.filterRiotMatches(sample, "solo", false), [{ queueId: 420 }]);
  assert.deepEqual(riotDisplay.filterRiotMatches(sample, "normal", false), [{ queueId: 490 }]);
  assert.deepEqual(riotDisplay.filterRiotMatches(sample, "double", true), [{ queueId: 1160 }]);
  assert.equal(riotDisplay.filterRiotMatches(sample, "all", false).length, sample.length);
  assert.equal(riotDisplay.rankQueueFor("flex", false), "RANKED_FLEX_SR");
  assert.equal(riotDisplay.rankQueueFor("double", true), "RANKED_TFT_DOUBLE_UP");
});

test("coach link saves a single Name#Tag only after successful verification", async () => {
  signIn(employeeSession); calls = []; globalThis.riotState.requests = [];
  load("lib/coach-ownership.ts").coachAccess({ ...employee, role: "employee" });
  state.coachAccess.set(employee.id, "demo");
  const coachApi = load("app/api/employee/coaches/route.ts");
  const request = body => new Request("http://localhost:3000/api/employee/coaches", { method: "PATCH", headers: { Origin: "http://localhost:3000" }, body: JSON.stringify(body) });
  assert.equal((await coachApi.PATCH(request({ slug: "luna", riotId: "Name#Tag#extra", platform: "vn2" }))).status, 400);
  assert.equal(calls.length, 0);
  respond = url => Response.json(url.includes("/by-riot-id/") ? { gameName: "Verified Coach", tagLine: "VN", puuid: "verified-coach" }
    : url.includes("/region/by-game/") ? { region: "VN2" } : { puuid: "verified-coach" });
  const response = await coachApi.PATCH(request({ slug: "luna", riotId: " Verified Coach # VN ", platform: "na1" }));
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).account, { gameName: "Verified Coach", tagLine: "VN", platform: "vn2" });
  assert.equal(load("lib/coach-riot-db.ts").coachRiotAccount("luna").puuid, "verified-coach");
  const detached = await coachApi.PATCH(request({ slug: "luna", unlink: true }));
  assert.equal(detached.status, 200);
  assert.equal(load("lib/coach-riot-db.ts").coachRiotAccount("luna"), undefined);
});

test("employee ownership protects profiles, avatars, Riot links and draft visibility", async () => {
  const ownership = load("lib/coach-ownership.ts");
  const coachApi = load("app/api/employee/coaches/route.ts");
  const profileApi = load("app/api/employee/coaches/[slug]/profile/route.ts");
  const publicApi = load("app/api/coaches/route.ts");
  const publicProfile = load("app/api/coaches/[slug]/route.ts");
  const avatarApi = load("app/api/employee/coaches/[slug]/avatar/route.ts");
  const matchApi = load("app/api/coaches/[slug]/matches/route.ts");
  const owner = db.createUser("Owner", "owner@example.test", "test-password");
  const other = db.createUser("Other", "other@example.test", "test-password");
  for (const user of [owner, other]) state.users.get(user.id).role = "employee";
  const ownerSession = db.createSession(owner.id), otherSession = db.createSession(other.id);
  const request = (body, method = "PATCH", origin = "http://localhost:3000") => new Request("http://localhost:3000/api/employee/coaches", { method, headers: { Origin: origin }, body: JSON.stringify(body) });
  const input = { name:"Owner Coach", game:"league-of-legends", server:"VN", peakRank:"Master", hourlyRate:20, languages:["Tiếng Việt"], roles:["Mid"], bio:"Coach introduction" };
  signIn(customerSession);
  assert.equal((await coachApi.POST(request(input,"POST"))).status,403);
  signIn(ownerSession);
  assert.deepEqual((await (await coachApi.GET()).json()).coaches, []);
  assert.equal((await coachApi.POST(request(input,"POST","https://other.test"))).status,403);
  assert.equal((await coachApi.POST(request({...input,roles:[]},"POST"))).status,400);
  assert.equal((await coachApi.POST(request({...input,game:"valorant",peakRank:"Master"},"POST"))).status,400);
  const created = await coachApi.POST(request(input,"POST"));
  assert.equal(created.status,201);
  const slug = (await created.json()).slug, context = { params: Promise.resolve({slug}) };
  assert.equal((await coachApi.POST(request(input,"POST"))).status,409);
  assert.equal((await publicProfile.GET(new Request("http://localhost:3000/"),context)).status,404);
  assert.equal((await matchApi.GET(new Request("http://localhost:3000/"),context)).status,404);
  assert.equal((await (await coachApi.GET()).json()).coaches[0].online,false);
  signIn(otherSession);
  assert.equal((await profileApi.GET(new Request("http://localhost:3000/"),context)).status,403);
  assert.equal((await profileApi.PATCH(request({online:true}),context)).status,403);
  assert.equal((await avatarApi.DELETE(request({},"DELETE"),context)).status,403);
  assert.equal((await avatarApi.POST(request({},"POST"),context)).status,403);
  calls = [];
  assert.equal((await coachApi.PATCH(request({slug,unlink:true}))).status,403);
  assert.equal(calls.length,0);
  signIn(employeeSession); // Explicit demo capability may only modify unowned samples.
  assert.equal((await profileApi.PATCH(request({online:true}),context)).status,403);
  assert.equal((await (await coachApi.GET()).json()).coaches.some(c=>c.slug===slug),false);
  signIn(ownerSession);
  const avatarUpload = (file, origin = "http://localhost:3000") => {
    const form = new FormData(); form.append("file",file);
    return new Request("http://localhost:3000/api/employee/coaches",{method:"POST",headers:{Origin:origin},body:form});
  };
  assert.equal((await avatarApi.POST(avatarUpload(new File(["svg"],"photo.svg",{type:"image/svg+xml"})),context)).status,400);
  assert.equal((await avatarApi.POST(avatarUpload(new File([new Uint8Array(5 * 1024 * 1024 + 1)],"large.png",{type:"image/png"})),context)).status,400);
  const croppedUpload = await avatarApi.POST(avatarUpload(new File(["cropped-jpeg"],"avatar.jpg",{type:"image/jpeg"})),context);
  assert.equal(croppedUpload.status,200);
  assert.ok((await croppedUpload.json()).override.avatar.startsWith("data:image/jpeg;base64,"));
  assert.equal((await avatarApi.DELETE(request({},"DELETE"),context)).status,200);
  for (const input of [{rating:5},{reviewCount:999},{isMvp:true},{reset:true}]) assert.equal((await profileApi.PATCH(request(input),context)).status,403);
  assert.equal((await profileApi.PATCH(request({online:true}),context)).status,200);
  assert.equal((await profileApi.PATCH(request({hourlyRate:35}),context)).status,200);
  assert.equal((await profileApi.PATCH(request({published:true}),context)).status,200);
  const photo = "data:image/png;base64,iVBORw0KGgo=";
  assert.equal((await profileApi.PATCH(request({avatar:photo}),context)).status,200);
  assert.equal((await (await publicProfile.GET(new Request("http://localhost:3000/"),context)).json()).coach.avatar,photo);
  const workspacePhoto = (await (await coachApi.GET()).json()).coaches.find(c=>c.slug===slug);
  assert.equal(workspacePhoto.profile.avatar,photo);
  assert.equal(workspacePhoto.avatar,"/images/coaches/luna.svg");
  assert.equal((await (await profileApi.GET(new Request("http://localhost:3000/"),context)).json()).published,true);
  assert.equal((await profileApi.PATCH(request({avatar:null}),context)).status,200);
  assert.equal((await (await publicProfile.GET(new Request("http://localhost:3000/"),context)).json()).coach.avatar,"/images/coaches/luna.svg");
  const publicList = (await (await publicApi.GET()).json()).coaches;
  assert.equal(publicList.find(c=>c.slug===slug).online,true);
  assert.equal(publicList.find(c=>c.slug===slug).hourlyRate,35);
  assert.equal(publicList.find(c=>c.slug===slug).reviewCount,0);
  assert.ok(load("data/coach-profile.ts").coachReputation(publicList.find(c=>c.slug===slug)).every(row => row.width === 0));
  assert.equal((await profileApi.PATCH(request({sessionLive:false,sessionVod:false}),context)).status,400);
  assert.equal((await profileApi.PATCH(request({roles:[]}),context)).status,400);
  assert.equal((await profileApi.PATCH(request({online:false}),context)).status,200);
  assert.equal((await (await publicProfile.GET(new Request("http://localhost:3000/"),context)).json()).coach.online,false);
  assert.equal((await profileApi.PATCH(request({published:false}),context)).status,200);
  assert.equal(ownership.coachPublished(slug),false);
  assert.equal((await publicProfile.GET(new Request("http://localhost:3000/"),context)).status,404);
  assert.equal((await (await coachApi.GET()).json()).coaches.length,1);
});

test("admin assigns one employee per coach and demo cannot edit an assigned sample", async () => {
  const admin = db.createUser("Admin", "admin@example.test", "test-password");
  const recipient = db.createUser("Recipient", "recipient@example.test", "test-password");
  for (const user of [admin, recipient]) state.users.get(user.id).role = "employee";
  state.coachAccess.set(admin.id, "admin");
  const assignments = load("app/api/employee/coaches/assignment/route.ts");
  const profiles = load("app/api/employee/coaches/[slug]/profile/route.ts");
  const request = body => new Request("http://localhost:3000/api/employee/coaches/assignment",{method:"PATCH",headers:{Origin:"http://localhost:3000"},body:JSON.stringify(body)});
  signIn(employeeSession);
  assert.equal((await assignments.GET()).status,403);
  assert.equal((await assignments.PATCH(request({userId:recipient.id,slug:"luna"}))).status,403);
  signIn(db.createSession(admin.id));
  assert.equal((await assignments.PATCH(request({userId:recipient.id,slug:"luna"}))).status,200);
  assert.equal((await assignments.PATCH(request({userId:recipient.id,slug:"luna"}))).status,409);
  signIn(employeeSession);
  assert.equal((await profiles.PATCH(request({online:true}),{params:Promise.resolve({slug:"luna"})})).status,403);
  signIn(db.createSession(recipient.id));
  assert.equal((await profiles.PATCH(request({online:true}),{params:Promise.resolve({slug:"luna"})})).status,200);
});

test("coach updates notify this tab and other tabs without storing profile data", () => {
  const events = load("lib/coach-profile-events.ts");
  const previousWindow = globalThis.window;
  const previousStorage = globalThis.localStorage;
  globalThis.window = new EventTarget();
  let savedKey, savedValue, refreshes = 0;
  globalThis.localStorage = { setItem(key, value) { savedKey = key; savedValue = value; } };
  try {
    const unsubscribe = events.subscribeCoachProfileUpdates(() => refreshes++);
    events.notifyCoachProfileUpdated();
    assert.equal(refreshes,1);
    assert.equal(savedKey,"ascend-coach-profile-revision");
    assert.match(savedValue,/^[a-f0-9-]{36}$/);
    const unrelated = new Event("storage"); unrelated.key = "other-setting";
    window.dispatchEvent(unrelated);
    assert.equal(refreshes,1);
    const update = new Event("storage"); update.key = savedKey;
    window.dispatchEvent(update);
    assert.equal(refreshes,2);
    localStorage.setItem = () => { throw new Error("storage disabled"); };
    assert.doesNotThrow(() => events.notifyCoachProfileUpdated());
    assert.equal(refreshes,3);
    unsubscribe();
    window.dispatchEvent(update);
    events.notifyCoachProfileUpdated();
    assert.equal(refreshes,3);
  } finally { globalThis.window = previousWindow; globalThis.localStorage = previousStorage; }
});

test("coach editing checks the browser host behind an internal Next URL", () => {
  const { isSameOrigin } = load("lib/auth-http.ts");
  const request = headers => new Request("http://localhost:3100/api/employee/coaches/luna/profile", { headers });
  assert.equal(isSameOrigin(request({host:"127.0.0.1:3100",origin:"http://127.0.0.1:3100"})),true);
  assert.equal(isSameOrigin(request({host:"coaching.example",origin:"https://coaching.example","x-forwarded-proto":"https"})),true);
  assert.equal(isSameOrigin(request({host:"127.0.0.1:3100",origin:"https://other.example"})),false);
  assert.equal(isSameOrigin(request({host:"127.0.0.1:3100"})),false);
});

test("saved coach match history survives memory cache resets and account changes cannot reuse it", async () => {
  const snapshots = load("lib/riot-history-db.ts");
  const account = {puuid:"snapshot-player",platform:"na1",gameName:"Snapshot",tagLine:"NA"};
  const history = {status:"ready",account:{platform:"na1",gameName:"Snapshot",tagLine:"NA"},matches:[{id:"NA1_saved",pick:"Ahri",won:true,role:"Mid",mode:"Ranked Solo/Duo",duration:1800,playedAt:Date.now()}],ranks:[],updatedAt:Date.now()};
  snapshots.saveRiotHistory(account,false,history);
  globalThis.riotState.cache.clear();
  calls = [];
  assert.deepEqual(riot.cachedRiotMatchHistory(account,false),history);
  assert.deepEqual(await riot.riotMatchHistory(account,false),history);
  assert.equal(calls.length,0);
  assert.equal(riot.cachedRiotMatchHistory({...account,puuid:"another-player"},false),null);
  assert.equal(riot.cachedRiotMatchHistory(account,true),null);
  snapshots.saveRiotHistory(account,false,{status:"unavailable",matches:[],error:"key-rejected"});
  assert.deepEqual(snapshots.savedRiotHistory(account,false),history);
});

test("missing API keys do not fetch upstream", async () => {
  signIn(employeeSession); calls = [];
  delete process.env.RIOT_API_KEY;
  const response = await api.GET(query({ endpoint: "val-status-v1.getPlatformData", game: "valorant", region: "na" }));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "key-missing");
  const historyResponse = await historyApi.POST(historyRequest({ riotId: "Player#VN", game: "lol", platform: "vn2" }));
  assert.equal(historyResponse.status, 503);
  assert.equal((await historyResponse.json()).error, "key-missing");
  assert.equal(calls.length, 0);
  process.env.RIOT_API_KEY = "test-key";
});
test("Riot 429 forwards Retry-After and halts subsequent upstream requests", async () => {
  signIn(employeeSession); calls = [];
  globalThis.riotState.requests = [];
  respond = () => Response.json({ status: {} }, { status: 429, headers: { "Retry-After": "35" } });
  const request = query({ endpoint: "val-status-v1.getPlatformData", game: "valorant", region: "br" });
  const response = await api.GET(request);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "35");
  assert.equal((await response.json()).error, "rate-limited");
  assert.equal((await api.GET(request)).status, 429);
  assert.equal(calls.length, 1);
});

test("coach champion statistics aggregate 30 ranked games, return top five and persist an hourly cache", async () => {
  const statsApi = load("app/api/riot/coach-stats/route.ts");
  const accounts = load("lib/coach-riot-db.ts");
  const ownership = load("lib/coach-ownership.ts");
  const account = { puuid: "ranked-champion-player", platform: "kr", gameName: "Stats", tagLine: "KR" };
  const previous = accounts.coachRiotAccount("luna");
  accounts.linkCoachRiotAccount("luna", account);
  ownership.setCoachPublished("luna", true);
  calls = []; globalThis.riotState.requests = []; globalThis.riotState.blockedUntil = 0;
  const champions = [[103, "Ahri", 10, 7], [157, "Yasuo", 6, 3], [238, "Zed", 5, 2], [99, "Lux", 4, 4], [86, "Garen", 3, 0], [22, "Ashe", 2, 1]];
  const players = champions.flatMap(([championId, championName, games, wins]) => Array.from({ length: games }, (_, index) => ({ puuid: account.puuid, championId, championName, win: index < wins })));
  respond = url => url.includes("/ids?") ? Response.json(players.map((_, index) => `KR_${index}`))
    : Response.json({ info: { queueId: 420, participants: [{ puuid: "another-player", championId: 1, championName: "Annie", win: true }, players[Number(url.split("KR_").at(-1))]] } });
  try {
    const request = () => new Request("http://localhost:3000/api/riot/coach-stats?coach=luna");
    const [first, concurrent] = await Promise.all([statsApi.GET(request()), statsApi.GET(request())]);
    const stats = await first.json();
    assert.deepEqual(await concurrent.json(), stats);
    assert.equal(stats.status, "ready"); assert.equal(stats.sampleSize, 30);
    assert.deepEqual(stats.topChampions.map(({ championId, gamesPlayed, wins, winRate }) => [championId, gamesPlayed, wins, winRate]), [[103,10,7,70],[157,6,3,50],[238,5,2,40],[99,4,4,100],[86,3,0,0]]);
    assert.equal(stats.topChampions[0].championKey, "Ahri");
    assert.equal(calls.length, 31);
    assert.ok(calls[0].url.startsWith("https://asia.api.riotgames.com/"));
    assert.ok(calls[0].url.includes("queue=420&start=0&count=30"));
    assert.ok(calls.every(call => call.options.next.revalidate === 3600 && call.options.cache === "force-cache"));
    assert.ok(!JSON.stringify(stats).includes(account.puuid)); assert.ok(!JSON.stringify(stats).includes("test-key"));
    const count = calls.length;
    globalThis.championStatsPending.clear();
    assert.deepEqual(await (await statsApi.GET(request())).json(), stats);
    assert.deepEqual(await (await statsApi.GET(new Request(`http://localhost:3000/api/riot/coach-stats?puuid=${account.puuid}&region=asia`))).json(), stats);
    assert.equal(calls.length, count);
    calls = []; globalThis.riotState.requests = [];
    respond = () => Response.json([]);
    const fresh = await statsApi.GET(new Request("http://localhost:3000/api/riot/coach-stats?coach=luna&refresh=1"));
    assert.equal((await fresh.json()).sampleSize, 0);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.cache, "no-store");
    assert.equal((await statsApi.GET(new Request("http://localhost:3000/api/riot/coach-stats?puuid=arbitrary&region=asia"))).status, 404);
    ownership.setCoachPublished("luna", false);
    assert.equal((await statsApi.GET(request())).status, 404);
    ownership.setCoachPublished("luna", true);
    const snapshotKey = load("lib/riot-history-db.ts").riotHistoryKey(account, false);
    state.championStats.set(snapshotKey, { ...stats, updatedAt: Date.now() - 3_600_001 });
    respond = () => Response.json({}, { status: 503 });
    const stale = await (await statsApi.GET(request())).json();
    assert.deepEqual(stale.topChampions, stats.topChampions); assert.equal(stale.error, "riot-unavailable");
  } finally {
    ownership.setCoachPublished("luna", true);
    if (previous) accounts.linkCoachRiotAccount("luna", previous); else accounts.unlinkCoachRiotAccount("luna");
  }
});

test("champion statistics filter unexpected queues, handle empty samples and never cache a partial failure", async () => {
  const { coachChampionStats } = load("lib/coach-champion-stats.ts");
  const account = { puuid: "filtered-champion-player", platform: "vn2", gameName: "Filter", tagLine: "VN" };
  calls = []; globalThis.riotState.requests = []; globalThis.riotState.blockedUntil = 0;
  respond = url => url.includes("/ids?") ? Response.json(["VN2_flex", "VN2_solo", "VN2_solo"])
    : Response.json({ info: { queueId: url.endsWith("flex") ? 440 : 420, participants: [{ puuid: account.puuid, championId: 103, championName: "Ahri", win: false }] } });
  const stats = await coachChampionStats(account);
  assert.equal(stats.sampleSize, 1); assert.equal(stats.topChampions[0].winRate, 0); assert.equal(calls.length, 3);
  assert.ok(calls[0].url.startsWith("https://sea.api.riotgames.com/"));
  respond = () => Response.json([]);
  const empty = await coachChampionStats({ ...account, puuid: "empty-champion-player" });
  assert.equal(empty.status, "ready"); assert.deepEqual(empty.topChampions, []); assert.equal(empty.sampleSize, 0);
  respond = url => url.includes("/ids?") ? Response.json(["VN2_first", "VN2_bad"])
    : url.endsWith("bad") ? Response.json({}, { status: 503 }) : Response.json({ info: { queueId: 420, participants: [{ puuid: "partial-player", championId: 103, championName: "Ahri", win: true }] } });
  const partialAccount = { ...account, puuid: "partial-player" };
  const partial = await coachChampionStats(partialAccount);
  assert.equal(partial.status, "unavailable"); assert.deepEqual(partial.topChampions, []);
  assert.equal(state.championStats.get(load("lib/riot-history-db.ts").riotHistoryKey(partialAccount, false)), undefined);
  delete process.env.RIOT_API_KEY; calls = [];
  const missing = await coachChampionStats({ ...account, puuid: "missing-key-player" });
  assert.equal(missing.error, "key-missing"); assert.equal(calls.length, 0);
  process.env.RIOT_API_KEY = "test-key";
});
