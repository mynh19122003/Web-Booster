import { test, expect } from "@playwright/test";
import { adminText, adminError } from "../../lib/admin/vi";
const englishUi =
  /\b(Dashboard|Orders|Staff|Security|Profile|Pending|Approved|Rejected|Search|View|Save|Cancel|Confirm|Loading|Actions|Status|Submitted|Workload|Capability|Unassigned|Priority|Standard|completed for|active orders)\b/;
test("Vietnamese admin routes contain no leftover English interface labels", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await expect(page.locator(".ap-root")).toHaveAttribute("lang", "vi");
  await expect(page.locator(".skip-link")).toHaveText("Chuyển đến nội dung");
  expect(await page.locator(".ap-root").innerText()).not.toMatch(englishUi);
  await page.locator('input[name="password"]').fill("DemoPass123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  for (const [width, height] of [
    [1366, 768],
    [768, 1024],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of [
      "",
      "orders",
      "incoming-orders",
      "assignments",
      "orders/ASC-1049",
      "orders/ASC-1042",
      "chat?order=ASC-1042",
      "staff",
      "staff/invitations",
      "security",
      "profile",
      "accept-invitation?token=demo-invitation",
    ]) {
      await page.goto("/admin/" + route);
      await expect(page.locator(".ap-root")).toBeVisible();
      expect(await page.locator(".ap-root").innerText(), route).not.toMatch(
        englishUi,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        route,
      ).toBe(true);
    }
    await page.screenshot({
      path: `test-results/admin-vi-invitation-${width}.png`,
      animations: "disabled",
    });
  }
  await page.goto("/admin");
  await page.getByLabel("Thông báo", { exact: true }).click();
  expect(
    await page.locator(".ap-notification-popover").innerText(),
  ).not.toMatch(englishUi);
  await page.screenshot({
    path: "test-results/admin-vi-dashboard.png",
    animations: "disabled",
  });
});
test("Vietnamese display mappings preserve raw API values and translate errors", () => {
  for (const [raw, label] of [
    ["PENDING", "Chờ xử lý"],
    ["APPROVED", "Đã duyệt"],
    ["WAITING_ASSIGNMENT", "Chờ phân công"],
    ["SUPER_ADMIN", "Quản trị viên cấp cao"],
    ["BOOSTER", "Nhân sự cày hạng"],
  ]) {
    expect(adminText(raw)).toBe(label);
    expect(raw).toMatch(/^[A-Z_]+$/);
  }
  expect(adminText("League of Legends")).toBe("League of Legends");
  expect(adminText("Emerald IV")).toBe("Emerald IV");
  for (const status of [401, 403, 404, 409, 422, 429, 500])
    expect(adminError({ status })).toMatch(/[À-ỹ]/);
  expect(
    adminError(
      new Error("Passwords must match and meet all password requirements."),
    ),
  ).toContain("Mật khẩu xác nhận");
});
