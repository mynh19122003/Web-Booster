import { test, expect, type Page } from "@playwright/test";
async function login(page: Page, viewer = false) {
  await page.goto("/admin/login");
  await expect(
    page.locator('img[src="/brand/logo-horizontal.png"]').last(),
  ).toBeVisible();
  if (viewer)
    await page
      .getByRole("button", { name: "Nhân sự chỉ xem", exact: true })
      .click();
  await page.locator('input[name="password"]').fill("DemoPass123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
}
test("staff-only admin routes, responsive branding and removed routes", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(page.url() + ": " + e.message));
  await login(page);
  await page.screenshot({
    path: "test-results/ascend-dashboard.png",
    fullPage: true,
  });
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "",
      "/orders",
      "/incoming-orders",
      "/assignments",
      "/orders/ASC-1042",
      "/chat",
      "/staff",
      "/staff/invitations",
      "/security",
      "/profile",
    ]) {
      await page.goto(`/admin${route}`);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator('a[href*="/employee"]')).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        await page
          .locator(".ap-brand img")
          .evaluateAll((imgs) =>
            imgs.every((img) => (img as HTMLImageElement).naturalWidth > 0),
          ),
      ).toBe(true);
    }
  }
  await page.screenshot({
    path: "test-results/ascend-admin-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Thu gọn thanh bên" }).click();
  await expect(
    page.locator('.ap-brand img[src="/brand/logo-icon.png"]'),
  ).toBeVisible();
  for (const route of [
    "/employee/orders",
    "/employee/orders/available",
    "/employee/orders/ASC-1042",
    "/admin/employee-applications",
  ]) {
    const response = await page.goto(route);
    if (route.startsWith("/admin/")) {
      // Next.js streamed not-found responses can have HTTP 200 with noindex.
      await expect(
        page.getByRole("heading", {
          name: "Trang này không còn trong không gian quản trị.",
        }),
      ).toBeVisible();
      await expect(
        page.locator('meta[name="robots"][content="noindex"]'),
      ).toHaveCount(1);
    } else {
      expect(response?.status(), route).toBe(404);
    }
  }
  expect(errors).toEqual([]);
});
test("assignment uses staff and read-only staff cannot mutate", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/orders/ASC-1049");
  await page
    .getByRole("button", { name: "Phân công nhân sự", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator('input[type="radio"]').first().check();
  await dialog
    .getByRole("button", { name: "Gửi đề nghị", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByText("Đã gửi đề nghị · Đang chờ phản hồi"),
  ).toBeVisible();
  await page.evaluate(() => sessionStorage.clear());
  await login(page, true);
  await page.goto("/admin/orders/ASC-1042");
  await expect(
    page.getByRole("heading", { name: "Tiến độ hiện tại" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Phân công lại", exact: true }),
  ).toHaveCount(0);
  await page.goto("/admin/chat?order=ASC-1042");
  await expect(
    page.getByRole("textbox", { name: "Nhập tin nhắn", exact: true }),
  ).toHaveCount(0);
});
