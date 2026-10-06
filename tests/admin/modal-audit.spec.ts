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
  await dialog.getByLabel("Đóng hộp thoại").click();
  await expect(dialog).toHaveCount(0);
}
for (const width of [1366, 390])
  test(`remaining dialogs and context drawer at ${width}`, async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
    await page.goto("/admin/login");
    await page.locator('input[name="password"]').fill("DemoPass123!");
    await page.getByRole("button", { name: "Đăng nhập" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/admin/staff");
    for (const [email, action] of [
      ["olivia@ascend.demo", "Chỉnh sửa quyền"],
      ["olivia@ascend.demo", "Tạm khóa"],
      ["olivia@ascend.demo", "Thu hồi các phiên đăng nhập"],
      ["james@ascend.demo", "Kích hoạt"],
    ]) {
      const row = page.getByRole("row").filter({ hasText: email });
      await row.getByLabel("Mở thao tác").click();
      await row.getByRole("button", { name: action, exact: true }).click();
      await closeAndCheck(page);
    }
    await page.goto("/admin/staff/invitations");
    await page
      .getByRole("button", { name: "Mời nhân sự", exact: true })
      .click();
    await closeAndCheck(page);
    await page.goto("/admin/security");
    await page
      .getByRole("button", { name: /^Thu hồi/ })
      .first()
      .click();
    await closeAndCheck(page);
    await page.goto("/admin/employee-applications/app-1048");
    await page
      .getByRole("button", { name: "Duyệt hồ sơ", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Duyệt và gửi thông tin đăng nhập" })
      .click();
    await page
      .getByRole("button", { name: "Gửi lại thông tin đăng nhập", exact: true })
      .click();
    await closeAndCheck(page);
    await page.goto("/admin/orders/ASC-1042");
    for (const name of ["Phân công lại", "Tạm dừng", "Hủy đơn", "Hoàn thành"]) {
      await page.getByRole("button", { name, exact: true }).click();
      await closeAndCheck(page);
    }
    await page.goto("/admin/chat?order=ASC-1042");
    await page.getByLabel("Mở hoặc đóng thông tin trò chuyện").click();
    const context = page.locator(".op-chat-context");
    await expect(context).toBeVisible();
    expect(
      await context.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    ).toBe(true);
    await context
      .getByRole("button", { name: "Xem khách hàng", exact: true })
      .click();
    await closeAndCheck(page);
    await context
      .getByRole("button", { name: "Xem nhân viên", exact: true })
      .click();
    await closeAndCheck(page);
    await context.getByLabel("Đóng thông tin trò chuyện").click();
    await expect(context).toHaveCount(0);
  });
