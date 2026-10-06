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
test("owner workspace and all routes render without runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/admin/login");
  await page.screenshot({
    path: "test-results/admin-login.png",
    fullPage: true,
  });
  await login(page);
  await page.screenshot({
    path: "test-results/admin-dashboard.png",
    fullPage: true,
  });
  for (const route of [
    "staff",
    "staff/invitations",
    "employee-applications",
    "security",
    "profile",
  ]) {
    await page.goto(`/admin/${route}`);
    await expect(page.locator("h1")).toBeVisible();
  }
  await expect(page.locator(".ap-root")).toHaveCSS("font-family", /Sora/);
  expect(errors).toEqual([]);
});
test("view-only staff cannot manage staff or approve applications", async ({
  page,
}) => {
  await login(page, true);
  await page.goto("/admin/staff");
  await expect(
    page.getByText("This area is restricted", { exact: true }),
  ).toBeVisible();
  await page.goto("/admin/employee-applications");
  await page.getByRole("link", { name: "Review Daniel Nguyen" }).click();
  await expect(
    page.getByRole("button", { name: "Approve application" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Reject", exact: true }),
  ).toHaveCount(0);
});
test("invitation accepts once and persists after reload", async ({ page }) => {
  await page.goto("/admin/accept-invitation?token=demo-invitation");
  await page.locator('input[name="password"]').fill("StrongDemo123!");
  await page.locator('input[name="confirmation"]').fill("StrongDemo123!");
  await page.getByRole("button", { name: "Accept invitation" }).click();
  await expect(page.getByText("You’re part of the team.")).toBeVisible();
  await page.reload();
  await page.locator('input[name="password"]').fill("StrongDemo123!");
  await page.locator('input[name="confirmation"]').fill("StrongDemo123!");
  await page.getByRole("button", { name: "Accept invitation" }).click();
  await expect(page.locator(".ap-error[role=alert]")).toContainText(
    "already been used",
  );
});
test("mobile workspace fits the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.screenshot({
    path: "test-results/admin-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("approve and reject decisions persist", async ({ page }) => {
  await login(page);
  await page.goto("/admin/employee-applications/app-1048");
  await page
    .getByRole("button", { name: "Approve application", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Approve & send credentials" })
    .click();
  await expect(
    page.getByRole("button", { name: "Resend credentials", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Resend credentials", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/employee-applications/app-1047");
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await page
    .getByLabel("Rejection reason")
    .fill("More coaching experience is required.");
  await page
    .getByRole("button", { name: "Reject application", exact: true })
    .click();
  await expect(
    page.getByText("More coaching experience is required.", { exact: true }),
  ).toBeVisible();
});

test("staff can be suspended and reactivated", async ({ page }) => {
  await login(page);
  await page.goto("/admin/staff");
  const row = page.getByRole("row").filter({ hasText: "olivia@ascend.demo" });
  await row.locator("summary").click();
  await row.getByRole("button", { name: "Suspend", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Suspend", exact: true })
    .click();
  await expect(row).toContainText("suspended");
  await row.locator("summary").click();
  await row.getByRole("button", { name: "Activate", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Activate", exact: true })
    .click();
  await expect(row.locator(".ap-badge")).toContainText("active");
});

test("password change signs out and guards private routes", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/profile");
  await page
    .getByLabel("Current password", { exact: true })
    .fill("DemoPass123!");
  await page
    .getByLabel("New password", { exact: true })
    .fill("NewDemoPass123!");
  await page
    .getByLabel("Confirm new password", { exact: true })
    .fill("NewDemoPass123!");
  await page
    .getByRole("button", { name: "Update password & sign out" })
    .click();
  await expect(page).toHaveURL(/\/admin\/login\?changed=1/);
  await page.goto("/admin/staff");
  await expect(page).toHaveURL(/\/admin\/login/);
});
