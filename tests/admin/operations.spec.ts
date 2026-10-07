import { test, expect, type Page } from "@playwright/test";
async function login(page: Page, viewer = false) {
  await page.goto("/admin/login");
  if (viewer)
    await page
      .getByRole("button", { name: "Nhân sự chỉ xem", exact: true })
      .click();
  await page.locator('input[name="password"]').fill("DemoPass123!");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
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
    page.getByRole("table", { name: "Đơn hàng", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/orders-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(page.getByText("Trang 2 trên 3", { exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Tìm đơn hàng" }).fill("Mynh");
  await expect(
    page.getByRole("link", { name: "#ASC-1042", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "Tìm đơn hàng" })
    .fill("does-not-exist");
  await expect(
    page.getByRole("heading", { name: "Chưa có đơn hàng" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xóa bộ lọc", exact: true }).click();
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
    page.getByRole("heading", { name: "Tiến độ hiện tại" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/order-detail.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
  expect(backendCalls).toEqual([]);
});
test("progress, pause and cancellation require deliberate confirmation", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/orders/ASC-1042");
  await page
    .getByRole("button", { name: "Cập nhật tiến độ", exact: true })
    .click();
  await page.getByLabel("Phần trăm tiến độ").fill("78");
  await page.getByRole("button", { name: "Lưu cập nhật", exact: true }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "78",
  );
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Hủy", exact: true })
    .click();
  await expect(page.locator(".ap-page-header .ap-badge")).toHaveText(
    "Đang thực hiện",
  );
  await page.getByRole("button", { name: "Tạm dừng", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Tạm dừng đơn", exact: true })
    .click();
  await expect(page.locator(".ap-page-header .ap-badge")).toHaveText(
    "Tạm dừng",
  );
  await page.getByRole("button", { name: "Hủy đơn", exact: true }).click();
  await page
    .getByLabel("Lý do hủy đơn")
    .fill("Customer requested cancellation in the demo.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Hủy đơn", exact: true })
    .click();
  await expect(page.locator(".ap-page-header .ap-badge")).toHaveText("Đã hủy");
  await page.reload();
  await expect(page.locator(".ap-page-header .ap-badge")).toHaveText("Đã hủy");
});
test("order action dropdown never navigates its row", async ({ page }) => {
  await login(page);
  await page.goto("/admin/orders");
  const row = page.getByRole("row").filter({ hasText: "ASC-1049" });
  await row.getByLabel("Mở thao tác").click();
  await row
    .getByRole("button", { name: "Phân công nhân sự", exact: true })
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
    .getByRole("button", { name: "Xem khách hàng", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("mynh.dat@example.com");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Đóng", exact: true })
    .click();
  const composer = page.getByRole("textbox", {
    name: "Nhập tin nhắn",
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
  await page.getByRole("tab", { name: "Ghi chú nội bộ" }).click();
  await page
    .getByRole("textbox", { name: "Viết ghi chú nội bộ" })
    .fill("Private escalation note for staff only.");
  await page.getByRole("button", { name: "Thêm ghi chú", exact: true }).click();
  await expect(
    page.getByText("Private escalation note for staff only.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Trao đổi với khách hàng" }).click();
  await expect(
    page.getByText("Private escalation note for staff only.", { exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "test-results/chat-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Lưu trữ cuộc trò chuyện", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Lưu trữ cuộc trò chuyện", exact: true })
    .click();
  await expect(
    page.getByText("Cuộc trò chuyện đã được lưu trữ. Mở lại để trả lời."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Mở lại cuộc trò chuyện", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Mở lại cuộc trò chuyện", exact: true })
    .click();
  await expect(composer).toBeVisible();
});
test("read-only permissions hide order mutations and composer", async ({
  page,
}) => {
  await login(page, true);
  await page.goto("/admin/orders/ASC-1042");
  await expect(
    page.getByRole("heading", { name: "Tiến độ hiện tại" }),
  ).toBeVisible();
  for (const name of [
    "Phân công lại",
    "Tạm dừng",
    "Hủy đơn",
    "Hoàn thành",
    "Cập nhật tiến độ",
  ])
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(
      0,
    );
  await page.goto("/admin/chat?order=ASC-1042");
  await expect(
    page.getByText("Bạn chỉ có quyền xem cuộc trò chuyện này."),
  ).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Nhập tin nhắn" }),
  ).toHaveCount(0);
});
test("mobile inbox drills into chat and back without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.goto("/admin/chat");
  await page
    .getByRole("button", { name: "Mở cuộc trò chuyện với Mynh Dat" })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Nhập tin nhắn" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/chat-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Quay lại danh sách trò chuyện" })
    .click();
  await expect(
    page.getByRole("button", { name: "Mở cuộc trò chuyện với Mynh Dat" }),
  ).toBeVisible();
  for (const route of [
    "/admin/orders",
    "/admin/incoming-orders",
    "/admin/assignments",
    "/admin/orders/ASC-1042",
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
