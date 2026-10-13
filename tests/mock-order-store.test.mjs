import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { createDemoChatStore } from "../scripts/demo-chat-store.mjs";
import { workflowFixture } from "./helpers/workflow-fixture.mjs";

test("saved claims seed missing mock data and order/chat ownership survives store handles", () => {
  const path = `orders-${randomUUID()}`;
  const customer = { id: "demo-customer", name: "Minh Anh", email: "minhanh@ascend.demo", role: "customer" };
  const zero = { id: "emp-zero", name: "Zero", role: "employee" };
  let store = createDemoChatStore(path);
  try {
    const fixture = workflowFixture();
    const cached = { ...fixture.orders.find(row => row.id === "ASC-1047"), employeeId: "emp-sofia", status: "IN_PROGRESS", progress: 25 };
    store.seedWorkflow(fixture, [cached]);
    assert.equal(store.workflow({ id: "emp-sofia", role: "employee" }).orders.find(row => row.id === cached.id).progress, 25);
    const created = store.createOrder(customer, { submissionId: randomUUID(), game: "valorant", service: "rank-boost", riotAccount: { riotPass: "not-stored" } });
    const claimed = store.claimOrder(created.order.id, zero);
    assert.equal(claimed.request.employeeId, claimed.order.employeeId);
    store.updateOrder(created.order.id, zero, "progress", 45);
    store.close(); store = createDemoChatStore(path);
    store.seedWorkflow(fixture); // Initial fixtures never reset existing claims/progress.
    const saved = store.workflow(customer).orders.find(row => row.id === created.order.id);
    assert.equal(saved.employeeId, zero.id);
    assert.equal(saved.progress, 45);
    assert.equal(store.get(created.order.id, customer).request.employeeName, "Zero");
    assert.equal(JSON.stringify(saved).includes("not-stored"), false);
  } finally { store.close(); }
});

test("paid coaching fixture is available to coaches and excludes boosters", () => {
  const store = createDemoChatStore(":memory:");
  const coach = { id: "emp-luna", name: "Luna", role: "employee" };
  try {
    store.seedWorkflow(workflowFixture());
    const seeded = store.workflow(coach).orders.find(row => row.id === "ASC-COACH-1056");
    assert.equal(seeded.paymentStatus, "PAID");
    assert.equal(seeded.amount, 24);
    assert.equal(seeded.status, "OPEN");
    assert.equal(seeded.coaching.sessionFormat, "live");
    assert.equal(store.workflow({ id: "emp-sofia", role: "employee" }).orders.some(row => row.id === seeded.id), false);
    assert.throws(() => store.claimOrder(seeded.id, { id: "emp-sofia", role: "employee" }), /FORBIDDEN/);
    const accepted = store.claimOrder(seeded.id, coach);
    assert.equal(accepted.request.employeeId, coach.id);
    assert.equal(accepted.order.employeeId, coach.id);
    assert.equal(accepted.order.instructions, "Phân tích replay và cải thiện kỹ năng đi đường Mid.");
  } finally { store.close(); }
});

test("coaching checkout preserves paid status and session metadata", () => {
  const store = createDemoChatStore(":memory:");
  try {
    store.seedWorkflow(workflowFixture());
    const created = store.createOrder({ id: "demo-customer", name: "Minh Anh", role: "customer" }, { submissionId: randomUUID(), game: "league-of-legends", service: "coaching", amount: 48, coaching: { coachId: "luna", coachName: "Luna", quantity: 2, sessionFormat: "vod", date: "2026-10-14", time: "20:00", timeZone: "Asia/Ho_Chi_Minh", riotPass: "should-never-persist" } });
    assert.equal(created.order.paymentStatus, "PAID");
    assert.equal(created.order.estimatedDuration, "2 giờ");
    assert.equal(created.order.amount, 48);
    assert.equal(created.order.coaching.sessionFormat, "vod");
    assert.equal(created.order.coaching.date, "2026-10-14");
    assert.equal(created.request.employeeId, null);
    assert.equal(JSON.stringify(created).includes("should-never-persist"), false);
    assert.equal(store.claimOrder(created.order.id, { id: "emp-luna", name: "Luna", role: "employee" }).order.employeeId, "emp-luna");
  } finally { store.close(); }
});
