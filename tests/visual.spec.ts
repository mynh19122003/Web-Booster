import { test, expect } from "@playwright/test";
test("Production section previews and WebGL context-loss fallback", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveCount(1);
  for (const [name, selector] of [
    ["services", "#services"],
    ["tracking", ".tracking-section"],
    ["features", ".feature-grid"],
    ["trophy", "#trophy"],
    ["players", "#pros"],
    ["security", ".security-section"],
    ["cta", "#final-cta"],
  ]) {
    await page.locator(selector).scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `test-results/section-${name}.png` });
  }
  await page.locator("#hero").scrollIntoViewIfNeeded();
  await page.locator("canvas").dispatchEvent("webglcontextlost");
  await expect(page.locator(".fallback-crystal")).toBeVisible();
  await page.getByRole("button", { name: "Review your plan" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
