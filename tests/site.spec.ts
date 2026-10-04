import { test, expect } from "@playwright/test";
const sizes = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
  { width: 375, height: 812 },
];
for (const size of sizes) {
  test(`Responsive production layout ${size.width}x${size.height}`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize(size);
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "YOUR GAME. YOUR RISE. OUR MISSION." }),
    ).toBeVisible();
    await expect(page.locator("canvas")).toBeVisible();
    await page.waitForTimeout(1800);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({ path: `test-results/hero-${size.width}.png` });
    await page.locator("#configure").scrollIntoViewIfNeeded();
    await page.waitForTimeout(750);
    await expect(
      page.getByRole("button", { name: "Review your plan" }),
    ).toBeVisible();
    await page.screenshot({ path: `test-results/config-${size.width}.png` });
    await page.locator("#faq").scrollIntoViewIfNeeded();
    await page
      .getByRole("button", { name: "How long does delivery take?" })
      .click();
    await expect(
      page.getByRole("region", { name: "How long does delivery take?" }),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}
test("Game navigation, configuration, saved plan, support and routes", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Games", exact: true }).click();
  await expect(page.locator("#games-menu")).toBeVisible();
  await page
    .locator("#games-menu")
    .getByRole("link", { name: /Valorant/ })
    .click();
  await expect(page).toHaveURL(/games\/valorant/);
  await expect(page.locator("#game")).toHaveValue("valorant");
  await page.getByRole("slider", { name: "CURRENT RANK" }).fill("2");
  await page.getByRole("slider", { name: "DESIRED RANK" }).fill("7");
  await page.getByRole("button", { name: "Duo", exact: true }).click();
  await page.getByLabel("REGION", { exact: true }).selectOption("NA");
  await page.getByRole("button", { name: "Review your plan" }).click();
  await expect(page.getByRole("dialog")).toContainText("$108.09");
  await page.getByRole("button", { name: "Save demo plan" }).click();
  await expect(page.getByRole("status")).toContainText("Saved on this device");
  await page.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: "Log in" }).click();
  await page.getByRole("button", { name: "Load saved plan" }).click();
  await expect(page.getByRole("dialog")).toContainText("Silver → Master");
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.goto("/support");
  await page.getByLabel("Your email").fill("player@example.com");
  await page
    .getByLabel("How can we help?")
    .fill("I would like to learn about the coaching service.");
  await page.getByRole("button", { name: "Validate demo request" }).click();
  await expect(page.locator(".support-form").getByRole("status")).toContainText(
    "no data has left your browser",
  );
  for (const route of [
    "/boosters",
    "/reviews",
    "/blog",
    "/blog/review-your-replays",
    "/services/coaching",
    "/legal/privacy",
    "/legal/terms",
  ]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
  }
  const response = await page.goto("/games/not-a-game");
  expect(response?.status()).toBe(404);
});
test("Mobile navigation, search, interactive demos, and reduced motion", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await page
    .locator("#games-menu")
    .getByRole("link", { name: /Rocket League/ })
    .click();
  await expect(page).toHaveURL(/rocket-league/);
  await page.getByRole("button", { name: "Search games" }).click();
  await page.getByLabel("Find your game").fill("zzzz");
  await expect(page.getByText("No games found.")).toBeVisible();
  await page.getByLabel("Find your game").fill("Valorant");
  await page
    .locator(".search-panel")
    .getByRole("link", { name: "Valorant" })
    .click();
  await expect(page).toHaveURL(/valorant/);
  await page.goto("/");
  await page.getByRole("switch", { name: "Invisible mode demo" }).click();
  await expect(page.getByRole("switch")).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await page.getByRole("button", { name: "Try a conversation" }).click();
  await expect(page.getByText("Absolutely. Let’s make a plan.")).toBeVisible();
  await page.getByRole("button", { name: /Simulate next match/ }).click();
  await expect(page.locator(".progress-demo")).toContainText("76%");
  expect(
    await page
      .locator(".gradient-text")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});
