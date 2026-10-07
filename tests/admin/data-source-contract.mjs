// Executes the actual TypeScript service modules with isolated browser storage.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = process.cwd();
const variables = [
  "AUTH",
  "STAFF",
  "DASHBOARD",
  "ORDERS",
  "ASSIGNMENTS",
  "CHAT",
  "SECURITY",
  "NOTIFICATIONS",
];
for (const mode of ["mock", "api", "mixed"]) {
  const cache = new Map();
  const storage = new Map();
  const sessionStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  const env = { ...process.env };
  for (const feature of variables)
    env[`NEXT_PUBLIC_ADMIN_${feature}_SOURCE`] =
      mode === "mixed"
        ? ["ASSIGNMENTS", "SECURITY", "NOTIFICATIONS"].includes(feature)
          ? "api"
          : "mock"
        : mode;
  let networkCalls = 0;
  function load(file) {
    const filename = path.resolve(
      root,
      file.endsWith(".ts") ? file : file + ".ts",
    );
    if (cache.has(filename)) return cache.get(filename).exports;
    const compiledModule = { exports: {} };
    cache.set(filename, compiledModule);
    const localRequire = (name) =>
      name.startsWith("@/")
        ? load(name.slice(2))
        : name.startsWith(".")
          ? load(
              path.relative(root, path.resolve(path.dirname(filename), name)),
            )
          : require(name);
    const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    vm.runInNewContext(`(function(require,module,exports){${code}\n})`, {
      process: { env },
      sessionStorage,
      structuredClone,
      crypto,
      Date,
      setTimeout,
      clearTimeout,
      fetch: () => {
        networkCalls++;
        throw new Error("Network is forbidden in review mode.");
      },
    })(localRequire, compiledModule, compiledModule.exports);
    return compiledModule.exports;
  }
  const { initializeReviewData } = load("services/mock/bootstrap");
  await initializeReviewData();
  const { authService } = load("services/auth.service");
  const { orderService, assignmentService, chatService } = load(
    "services/operations",
  );
  const { staffService } = load("services/staff.service");
  const { dashboardService } = load("services/dashboard.service");
  const { securityService } = load("services/security.service");
  const operations = load("lib/admin/operations-store").useOperations;
  const admin = load("lib/admin/store").useAdminStore;
  if (mode === "mock") {
    await authService.login("alex@ascend.demo", "ReviewPass123!");
    assert.ok((await orderService.getOrders()).length);
    assert.ok((await assignmentService.getAssignments()).length);
    assert.ok((await chatService.getConversations()).length);
    assert.ok((await staffService.getStaff()).length);
    assert.ok((await dashboardService.getDashboard()).activeStaff > 0);
    assert.ok((await securityService.getSecuritySessions()).length);
    await chatService.sendMessage(
      "chat-ASC-1042",
      "Contract message",
      "CUSTOMER",
    );
    assert.ok(
      operations
        .getState()
        .messages.some((message) => message.body === "Contract message"),
    );
  } else if (mode === "mixed") {
    await authService.login("alex@ascend.demo", "ReviewPass123!");
    await orderService.reviewOrder("ASC-1049");
    await staffService.createStaffInvitation({
      email: "review@example.test",
      fullName: "Review",
      displayName: "Review",
      permissions: [],
    });
    await assert.rejects(
      () => orderService.assignStaff("ASC-1049", "emp-zen"),
      (error) => error.code === "NOT_IMPLEMENTED",
    );
    assert.equal(admin.getState().sessions.length, 0);
    assert.equal(admin.getState().activities.length, 0);
    assert.equal(operations.getState().notifications.length, 0);
    assert.equal(operations.getState().assignments.length, 0);
  } else {
    for (const action of [
      () => authService.login("alex@ascend.demo", "ReviewPass123!"),
      () => orderService.getOrders(),
      () => assignmentService.getAssignments(),
      () => chatService.getConversations(),
      () => staffService.getStaff(),
      () => dashboardService.getDashboard(),
      () => securityService.getSecuritySessions(),
      () =>
        chatService.sendMessage(
          "chat-ASC-1042",
          "Forbidden fallback",
          "CUSTOMER",
        ),
    ]) {
      await assert.rejects(action, (error) => error.code === "NOT_IMPLEMENTED");
    }
    assert.equal(admin.getState().user, null);
    assert.equal(admin.getState().staff.length, 0);
    for (const key of [
      "orders",
      "employees",
      "assignments",
      "events",
      "conversations",
      "messages",
      "notifications",
    ])
      assert.equal(operations.getState()[key].length, 0);
  }
  assert.equal(networkCalls, 0);
  console.log(`${mode.toUpperCase()}: services and source isolation PASS`);
}
