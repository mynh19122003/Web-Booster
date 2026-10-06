import { test, expect } from "@playwright/test";

test("Admin Vietnamese font, compact filters and readable chat at every viewport", async ({
  page,
}) => {
  test.setTimeout(240000);
  await page.goto("/admin/login");
  await page.locator('input[name="password"]').fill("DemoPass123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  for (const [width, height] of [
    [1920, 1080],
    [1600, 900],
    [1440, 900],
    [1366, 768],
    [1280, 720],
    [1024, 768],
    [768, 1024],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/admin/orders");
    await expect(page.locator(".ap-root")).toHaveCSS("font-size", "15px");
    await expect(page.locator(".ap-root")).toHaveCSS(
      "font-family",
      /Be Vietnam Pro/,
    );
    const widths = await page
      .locator(".op-order-filters select")
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width));
    if (width > 760) expect(Math.max(...widths)).toBeLessThanOrEqual(261);
    await expect(page.locator(".op-order-filters select").first()).toHaveCSS(
      "font-size",
      "15px",
    );
    await expect(page.locator(".op-order-filters select").first()).toHaveCSS(
      "min-height",
      "46px",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/typography-orders-${width}.png`,
      fullPage: true,
    });
    await page.goto("/admin/chat?order=ASC-1042");
    await expect(page.locator(".op-message-bubble p").first()).toHaveCSS(
      "font-size",
      "16px",
    );
    await expect(page.locator(".op-message-bubble p").first()).toHaveCSS(
      "line-height",
      "25.6px",
    );
    await expect(page.locator(".op-message-time").first()).toHaveCSS(
      "font-size",
      "12px",
    );
    expect(
      await page
        .locator(".op-message")
        .first()
        .evaluate(
          (el) =>
            el.getBoundingClientRect().width / el.parentElement!.clientWidth,
        ),
    ).toBeLessThanOrEqual(width <= 760 ? 0.91 : 0.81);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/typography-chat-${width}.png`,
      fullPage: true,
    });
  }
  // Verify actual glyph rendering, rather than just the CSS font-family string.
  await page.evaluate(async () => {
    const probe = document.createElement("p");
    probe.id = "vietnamese-font-probe";
    probe.textContent =
      "Đang thực hiện Nhân viên phụ trách Chờ xử lý Đã hoàn thành Tranh chấp Hồ sơ ứng tuyển Phân công nhân viên Quản trị viên Ghi chú nội bộ Thông tin đơn hàng Tỷ lệ thành công Thời gian hoàn thành trung bình";
    document.querySelector(".ap-root")!.append(probe);
    await document.fonts.ready;
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  const { root } = await cdp.send("DOM.getDocument");
  const { nodeId } = await cdp.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector: "#vietnamese-font-probe",
  });
  const { fonts } = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
  expect(fonts.length).toBeGreaterThan(0);
  for (const font of fonts) {
    expect(font.isCustomFont).toBe(true);
    expect(font.familyName).toMatch(/Be Vietnam Pro/i);
  }
  await cdp.detach();
  await page.goto("/employee/orders");
  await expect(page.locator(".ap-root")).toHaveCSS("font-family", /Sora/);
  await expect(page.locator(".ap-root")).toHaveCSS("font-size", "13px");
});
