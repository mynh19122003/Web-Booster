import { test, expect } from "@playwright/test";
test("review shows complete details, blocks repeated submit and updates only mock state", async ({
  page,
}) => {
  const calls: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/v1/")) calls.push(r.url());
  });
  await page.goto("/admin/login");
  await page.locator('input[name="password"]').fill("DemoPass123!");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/orders/ASC-1049");
  await page.getByRole("button", { name: "Xác nhận đơn", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("theo.martin@example.com");
  await expect(dialog).toContainText(
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "USD",
    }).format(119),
  );
  await dialog.locator("form").evaluate((el) => {
    const form = el as HTMLFormElement;
    form.requestSubmit();
    form.requestSubmit();
  });
  await expect(
    dialog.getByRole("button", { name: "Đang lưu…", exact: true }),
  ).toBeDisabled();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".ap-page-header .ap-badge")).toHaveText(
    "Chờ phân công",
  );
  await expect(
    page.locator(".ap-timeline-item").filter({ hasText: "Đã xác nhận đơn" }),
  ).toHaveCount(1);
  expect(calls).toEqual([]);
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
    await page
      .getByRole("button", { name: "Phân công nhân sự", exact: true })
      .click();
    await page.screenshot({
      path: `test-results/assign-final-${width}.png`,
      animations: "disabled",
    });
    await page.locator(".ap-modal-body").evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.screenshot({
      path: `test-results/assign-bottom-${width}.png`,
      animations: "disabled",
    });
    await page.keyboard.press("Escape");
  }
});
