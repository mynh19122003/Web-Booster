import { test, expect, type Page } from "@playwright/test";
const sizes = [
  [1920, 1080],
  [1440, 900],
  [1366, 768],
  [1280, 720],
  [1024, 768],
  [768, 1024],
  [390, 844],
];
async function login(page: Page) {
  await page.goto("/admin/login");
  await page.locator('input[name="password"]').fill("DemoPass123!");
  await page.getByRole("button", { name: "Sign in to workspace" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}
async function checkDialog(page: Page) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(
    await dialog.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return (
        r.top >= 0 &&
        r.left >= 0 &&
        r.bottom <= innerHeight + 1 &&
        r.right <= innerWidth + 1 &&
        el.scrollWidth <= el.clientWidth + 1
      );
    }),
  ).toBe(true);
  await expect(dialog.locator("footer")).toBeInViewport();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
}
test("all admin routes and key dialogs fit every requested viewport", async ({
  page,
}) => {
  test.setTimeout(360000);
  await login(page);
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    for (const route of [
      "",
      "orders",
      "incoming-orders",
      "assignments",
      "orders/ASC-1049",
      "chat",
      "staff",
      "staff/invitations",
      "employee-applications",
      "employee-applications/app-1048",
      "security",
      "profile",
    ]) {
      await page.goto("/admin/" + route);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${route} ${width}`,
      ).toBe(true);
    }
    await page.goto("/admin/orders/ASC-1049");
    await page
      .getByRole("button", { name: "Assign employee", exact: true })
      .click();
    const radio = page.locator(".op-candidate input").first();
    await expect(radio).toHaveCSS("width", "15px");
    await expect(page.locator(".op-candidate .ap-avatar").first()).toHaveCSS(
      "width",
      "44px",
    );
    await page.screenshot({ path: `test-results/assign-${width}.png` });
    await page.locator(".ap-modal-body").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await expect(page.locator(".op-candidate").last()).toBeInViewport();
    await expect(page.getByRole("dialog").locator("header")).toBeInViewport();
    await checkDialog(page);
    await page.goto("/admin/incoming-orders");
    await page
      .getByRole("button", { name: "Review order", exact: true })
      .first()
      .click();
    for (const field of [
      "Customer",
      "Game",
      "Service",
      "Current",
      "Target",
      "Region",
      "Price",
      "Options",
      "Submitted",
    ])
      await expect(
        page
          .getByRole("dialog")
          .locator("dt")
          .filter({ hasText: new RegExp(`^${field}$`) }),
      ).toBeVisible();
    await page.screenshot({ path: `test-results/review-${width}.png` });
    await page.locator(".ap-modal-body").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await expect(
      page.getByRole("dialog").getByText("Submitted", { exact: true }),
    ).toBeInViewport();
    await checkDialog(page);
    await page.goto("/admin/employee-applications/app-1048");
    for (const name of ["Approve application", "Reject"]) {
      await page.getByRole("button", { name, exact: true }).click();
      await checkDialog(page);
    }
  }
});
