import { test, expect } from "@playwright/test";
test("all Admin review modules work offline without any API request", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/"))
      requests.push(request.url());
  });
  await page.route("**/api/**", (route) => route.abort());
  await page.goto("/admin/login");
  await page.locator('input[name="password"]').fill("ReviewPass123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.locator(".ap-stat strong").first()).not.toHaveText("—");
  for (const route of [
    "/orders",
    "/incoming-orders",
    "/assignments",
    "/orders/ASC-1042",
    "/chat?order=ASC-1042",
    "/staff",
    "/staff/invitations",
    "/security",
    "/profile",
  ]) {
    await page.goto(`/admin${route}`);
    await expect(page.locator(".ap-workspace")).toBeVisible();
    await expect(page.locator(".ap-content h1")).toBeVisible();
    await expect(page.locator(".ap-content")).not.toContainText(
      /DÙNG THỬ|dùng thử|Mock data|Preview mode/,
    );
  }
  await page.goto("/admin/chat?order=ASC-1042");
  await page
    .getByRole("textbox", { name: "Nhập tin nhắn", exact: true })
    .fill("Tin nhắn kiểm tra nguồn dữ liệu.");
  await page.getByRole("button", { name: "Gửi", exact: true }).click();
  await expect(
    page
      .locator(".op-message-bubble")
      .filter({ hasText: "Tin nhắn kiểm tra nguồn dữ liệu." }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page
      .locator(".op-message-bubble")
      .filter({ hasText: "Tin nhắn kiểm tra nguồn dữ liệu." }),
  ).toBeVisible();
  expect(requests).toEqual([]);
});
