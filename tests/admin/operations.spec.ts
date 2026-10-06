import { test, expect, type Page } from "@playwright/test";
async function login(page: Page, viewer = false) {
  await page.goto("/admin/login");
  if (viewer)
    await page
      .getByRole("button", { name: "View-only staff", exact: true })
      .click();
  await page.locator('input[name="password"]').fill("DemoPass123!");
  await page.getByRole("button", { name: "Sign in to workspace" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}
test("operations pages render, filter and paginate without backend calls", async ({
  page,
}) => {
  const errors: string[] = [];
  const backendCalls: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().includes("/api/v1/")) backendCalls.push(r.url());
  });
  await login(page);
  await page.setViewportSize({ width: 1600, height: 1050 });
  await page.goto("/admin/orders");
  await expect(
    page.getByRole("table", { name: "Orders", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/orders-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page.getByText("Page 2 of 3", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Search orders" }).fill("Mynh");
  await expect(
    page.getByRole("link", { name: "#ASC-1042", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Search orders" })
    .fill("does-not-exist");
  await expect(
    page.getByRole("heading", { name: "No orders yet" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Clear filters", exact: true })
    .click();
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(6);
  for (const route of [
    "incoming-orders",
    "assignments",
    "orders/ASC-1042",
    "chat",
  ]) {
    await page.goto(`/admin/${route}`);
    await expect(page.locator("h1")).toBeVisible();
  }
  await page.goto("/admin/orders/ASC-1042");
  await expect(
    page.getByRole("heading", { name: "Live progress" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/order-detail.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(backendCalls).toEqual([]);
});
test("assignment offer, employee decline, reassignment and accept share state", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/orders/ASC-1049");
  await page
    .getByRole("button", { name: "Assign employee", exact: true })
    .click();
  await page.locator('input[name="employee_id"][value="emp-nova"]').check();
  await page.getByRole("button", { name: "Send offer", exact: true }).click();
  await expect(
    page.getByText("Offer sent · Waiting for response", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open employee preview" }).click();
  await expect(
    page.getByRole("combobox", { name: "Preview employee" }),
  ).toHaveValue("emp-nova");
  await page.getByRole("button", { name: "Decline", exact: true }).click();
  await page
    .getByLabel("Decline reason")
    .fill("Currently unavailable for the requested time.");
  await page
    .getByRole("button", { name: "Decline offer", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Offer declined" }),
  ).toBeVisible();
  await page.goto("/admin/orders/ASC-1049");
  await expect(
    page.getByText("Reason: Currently unavailable for the requested time."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Assign employee", exact: true })
    .click();
  await page.locator('input[name="employee_id"][value="emp-zen"]').check();
  await page.getByRole("button", { name: "Send offer", exact: true }).click();
  await page.getByRole("link", { name: "Open employee preview" }).click();
  await page.getByRole("button", { name: "Accept order", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Accept order", exact: true })
    .click();
  await expect(
    page.getByText("Offer accepted. You’re ready to start."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start work", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Start work", exact: true })
    .click();
  await expect(page.locator(".ap-page-header .ap-badge")).toHaveText(
    "in progress",
  );
  await page.goto("/admin/orders/ASC-1049");
  await expect(page.locator(".ap-page-header .ap-badge")).toHaveText(
    "in progress",
  );
  await expect(
    page.getByText("Employee accepted order", { exact: true }),
  ).toBeVisible();
});
test("progress, pause and cancellation require deliberate confirmation", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/orders/ASC-1042");
  await page
    .getByRole("button", { name: "Update progress", exact: true })
    .click();
  await page.getByLabel("Progress percent").fill("78");
  await page.getByRole("button", { name: "Save update", exact: true }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "78",
  );
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(page.locator(".ap-page-header .ap-badge")).toHaveText(
    "in progress",
  );
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Pause order", exact: true })
    .click();
  await expect(page.locator(".ap-page-header .ap-badge")).toHaveText("paused");
  await page.getByRole("button", { name: "Cancel order", exact: true }).click();
  await page
    .getByLabel("Cancellation reason")
    .fill("Customer requested cancellation in the demo.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel order", exact: true })
    .click();
  await expect(page.locator(".ap-page-header .ap-badge")).toHaveText(
    "cancelled",
  );
  await page.reload();
  await expect(page.locator(".ap-page-header .ap-badge")).toHaveText(
    "cancelled",
  );
});
test("order action dropdown never navigates its row", async ({ page }) => {
  await login(page);
  await page.goto("/admin/orders");
  const row = page.getByRole("row").filter({ hasText: "ASC-1049" });
  await row.getByLabel("Open actions").click();
  await row
    .getByRole("button", { name: "Assign employee", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/orders$/);
});
test("chat separates internal notes, supports send and archive", async ({
  page,
}) => {
  await login(page);
  await page.setViewportSize({ width: 1700, height: 1050 });
  await page.goto("/admin/chat?order=ASC-1042");
  await page
    .locator(".op-chat-header")
    .getByRole("button", { name: "View customer", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("mynh.dat@example.com");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Done", exact: true })
    .click();
  const composer = page.getByRole("textbox", {
    name: "Type a message",
    exact: true,
  });
  await composer.fill("Thanks for checking in.");
  await composer.press("Shift+Enter");
  await composer.pressSequentially("We are on schedule.");
  await expect(composer).toHaveValue(
    "Thanks for checking in.\nWe are on schedule.",
  );
  await composer.press("Enter");
  await expect(
    page
      .locator(".op-message-bubble")
      .filter({ hasText: "We are on schedule." }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Internal notes" }).click();
  await page
    .getByRole("textbox", { name: "Write an internal note" })
    .fill("Private escalation note for staff only.");
  await page.getByRole("button", { name: "Add note", exact: true }).click();
  await expect(
    page.getByText("Private escalation note for staff only.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Customer chat" }).click();
  await expect(
    page.getByText("Private escalation note for staff only.", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "test-results/chat-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Archive conversation", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Archive conversation", exact: true })
    .click();
  await expect(
    page.getByText("This conversation is archived. Reopen it to reply."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Reopen conversation", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Reopen conversation", exact: true })
    .click();
  await expect(composer).toBeVisible();
});
test("read-only permissions hide order mutations and composer", async ({
  page,
}) => {
  await login(page, true);
  await page.goto("/admin/orders/ASC-1042");
  await expect(
    page.getByRole("heading", { name: "Live progress" }),
  ).toBeVisible();
  for (const name of [
    "Reassign",
    "Pause",
    "Cancel order",
    "Complete",
    "Update progress",
  ])
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(
      0,
    );
  await page.goto("/admin/chat?order=ASC-1042");
  await expect(
    page.getByText("You have read-only access to this conversation."),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Type a message" }),
  ).toHaveCount(0);
});
test("mobile inbox drills into chat and back without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.goto("/admin/chat");
  await page
    .getByRole("button", { name: "Open conversation with Mynh Dat" })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Type a message" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/chat-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Back to conversations" }).click();
  await expect(
    page.getByRole("button", { name: "Open conversation with Mynh Dat" }),
  ).toBeVisible();
  for (const route of [
    "/admin/orders",
    "/admin/incoming-orders",
    "/admin/assignments",
    "/admin/orders/ASC-1042",
    "/employee/orders",
    "/employee/orders/available",
    "/employee/orders/ASC-1043?employee=emp-zen",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
