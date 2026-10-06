import { test, expect, type Page } from "@playwright/test";
async function closeAndCheck(page: Page) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("footer")).toBeInViewport();
  expect(
    await dialog.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return (
        r.top >= 0 &&
        r.bottom <= innerHeight + 1 &&
        r.left >= 0 &&
        r.right <= innerWidth + 1 &&
        el.scrollWidth <= el.clientWidth + 1
      );
    }),
  ).toBe(true);
  await dialog.getByLabel("Close dialog").click();
  await expect(dialog).toHaveCount(0);
}
for (const width of [1366, 390])
  test(`remaining dialogs and context drawer at ${width}`, async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
    await page.goto("/admin/login");
    await page.locator('input[name="password"]').fill("DemoPass123!");
    await page.getByRole("button", { name: "Sign in to workspace" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/admin/staff");
    for (const [email, action] of [
      ["olivia@ascend.demo", "Edit permissions"],
      ["olivia@ascend.demo", "Suspend"],
      ["olivia@ascend.demo", "Revoke sessions"],
      ["james@ascend.demo", "Activate"],
    ]) {
      const row = page.getByRole("row").filter({ hasText: email });
      await row.getByLabel("Open actions").click();
      await row.getByRole("button", { name: action, exact: true }).click();
      await closeAndCheck(page);
    }
    await page.goto("/admin/staff/invitations");
    await page
      .getByRole("button", { name: "Invite staff", exact: true })
      .click();
    await closeAndCheck(page);
    await page.goto("/admin/security");
    await page
      .getByRole("button", { name: /^Revoke/ })
      .first()
      .click();
    await closeAndCheck(page);
    await page.goto("/admin/employee-applications/app-1048");
    await page
      .getByRole("button", { name: "Approve application", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Approve & send credentials" })
      .click();
    await page
      .getByRole("button", { name: "Resend credentials", exact: true })
      .click();
    await closeAndCheck(page);
    await page.goto("/admin/orders/ASC-1042");
    for (const name of ["Reassign", "Pause", "Cancel order", "Complete"]) {
      await page.getByRole("button", { name, exact: true }).click();
      await closeAndCheck(page);
    }
    await page.goto("/admin/chat?order=ASC-1042");
    await page.getByLabel("Toggle conversation context").click();
    const context = page.locator(".op-chat-context");
    await expect(context).toBeVisible();
    expect(
      await context.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    await context
      .getByRole("button", { name: "View customer", exact: true })
      .click();
    await closeAndCheck(page);
    await context
      .getByRole("button", { name: "View employee", exact: true })
      .click();
    await closeAndCheck(page);
    await context.getByLabel("Close context").click();
    await expect(context).toHaveCount(0);
  });
