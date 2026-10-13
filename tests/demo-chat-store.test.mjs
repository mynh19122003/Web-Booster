import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { createDemoChatStore } from "../scripts/demo-chat-store.mjs";

test("shared preview history survives store handles and duplicate acknowledgements", () => {
  const path = `chat-${randomUUID()}`;
  const user = { id: "emp-sofia", name: "Sofia", role: "employee" };
  const customer = { id: "demo-customer", name: "Minh Anh", role: "customer" };
  const clientId = randomUUID();
  let store = createDemoChatStore(path);
  try {
    const sent = store.send("DEMO-1055", user, "Saved in mock state", clientId);
    assert.equal(store.unread(customer).total, 1);
    store.markRead("DEMO-1055", customer, clientId);
    store.close(); store = createDemoChatStore(path);
    assert.equal(store.get("DEMO-1055", user).messages.at(-1).text, "Saved in mock state");
    assert.equal(store.unread(customer).total, 0);
    assert.equal(store.send("DEMO-1055", user, "Saved in mock state", clientId).messages.length, sent.messages.length);
    assert.throws(() => store.get("DEMO-1054", user), /forbidden/);
  } finally { store.close(); }
});

test("unread counts exclude fixtures and own replies and stale reads cannot clear newer messages", () => {
  const store = createDemoChatStore(":memory:");
  const staff = { id: "emp-sofia", name: "Sofia", role: "employee" };
  const customer = { id: "demo-customer", name: "Minh Anh", role: "customer" };
  try {
    assert.equal(store.unread(staff).total, 0);
    const first = store.send("DEMO-1055", customer, "First incoming", randomUUID()).messages.at(-1).id;
    assert.equal(store.unread(staff).total, 1);
    assert.equal(store.markRead("DEMO-1055", staff, first).total, 0);
    store.send("DEMO-1055", customer, "Second incoming", randomUUID());
    assert.equal(store.markRead("DEMO-1055", staff, first).total, 1);
    store.send("DEMO-1055", staff, "My reply", randomUUID());
    assert.equal(store.unread(staff).total, 1);
    assert.equal(store.unread(customer).total, 1);
    assert.throws(() => store.markRead("DEMO-1054", staff, first), /forbidden/);
  } finally { store.close(); }
});
