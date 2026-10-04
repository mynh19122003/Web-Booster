import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/exchange-rate", (route) =>
    route.fulfill({ json: { usdPerEur: 1.2, date: "2026-10-02" } }),
  );
});

test("Click ranks, enforce progression and switch currencies both ways", async ({
  page,
}) => {
  await page.goto("/games/valorant");
  await expect(page.locator("#game")).toHaveValue("valorant");
  await page
    .getByRole("button", { name: "Current rank: Gold 2", exact: true })
    .click();
  await expect(page.locator(".rank-selected").first()).toHaveText("Gold 2");
  await page
    .getByRole("button", { name: "Desired rank: Gold", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Desired rank: Gold 1", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Desired rank: Gold 2", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Desired rank: Gold 3", exact: true })
    .click();
  await expect(page.locator(".converted-price")).toContainText("$5.54");
  await page
    .locator(".price-summary")
    .getByRole("button", { name: "EUR", exact: true })
    .click();
  await expect(page.locator(".converted-price")).toContainText("€4.62");
  await page
    .locator(".price-summary")
    .getByRole("button", { name: "USD", exact: true })
    .click();
  await expect(page.locator(".converted-price")).toContainText("$5.54");
  await page
    .getByRole("button", { name: "Current rank: Immortal", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Current rank: Immortal 3", exact: true })
    .click();
  await expect(page.locator(".rank-selected").last()).toHaveText("Radiant");
  await expect(
    page.getByRole("group", { name: "Desired rank division", exact: true }),
  ).toHaveCount(0);
  await page.locator("#game").selectOption("league-of-legends");
  await expect(page.locator(".rank-selected").first()).toHaveText("Gold IV");
  await expect(
    page.getByRole("button", { name: "Current rank: Emerald", exact: true }),
  ).toBeVisible();
});

test("Recruitment submission, admin review, filtering, export and deletion", async ({
  page,
}) => {
  await page.goto("/careers");
  await page.getByLabel("Full name", { exact: true }).fill("Test Coach");
  await page.getByLabel("Email", { exact: true }).fill("coach@example.com");
  await page.getByLabel("Phone number").fill("+84 912345678");
  await page.getByLabel("Game", { exact: true }).selectOption("valorant");
  await page
    .getByLabel("Current rank", { exact: true })
    .selectOption("Immortal 3");
  await page.getByLabel(/I agree/).check();
  await page.getByRole("button", { name: "Save application" }).click();
  await expect(page.locator(".application-success")).toContainText(
    "Application saved",
  );
  await page.goto("/admin");
  await page.getByRole("button", { name: "Recruitment" }).click();
  await expect(page.locator("tbody")).toContainText("Test Coach");
  await page.getByLabel("Status for Test Coach").selectOption("Reviewing");
  await page.reload();
  await page.getByRole("button", { name: "Recruitment" }).click();
  await expect(page.getByLabel("Status for Test Coach")).toHaveValue(
    "Reviewing",
  );
  await page.getByLabel("Search records").fill("not-found");
  await expect(page.getByText("No matching records")).toBeVisible();
  await page.getByLabel("Search records").fill("");
  await page.getByRole("button", { name: "View Test Coach" }).click();
  await expect(page.getByRole("dialog")).toContainText("+84 912345678");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  expect((await download).suggestedFilename()).toContain("ascend-applications");
  await page.getByRole("button", { name: "Delete Test Coach" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(page.getByText("No records yet")).toBeVisible();
});

test("Service selection links and coaching requests reach admin", async ({
  page,
}) => {
  await page.goto("/services");
  await page
    .getByRole("button", { name: "Teamfight Tactics", exact: true })
    .click();
  await expect(page.locator(".catalog-item")).toHaveCount(2);
  await page
    .locator(".catalog-item")
    .filter({ hasText: "Personal coaching" })
    .getByRole("link")
    .click();
  await expect(page.locator("#game")).toHaveValue("teamfight-tactics");
  await expect(page.getByLabel("Coaching hours")).toBeVisible();
  await page.getByLabel("Coaching hours").fill("2");
  await page.getByRole("button", { name: "Review your plan" }).click();
  await page.getByRole("dialog").getByLabel("Full name").fill("Test Customer");
  await page
    .getByRole("dialog")
    .getByLabel("Email", { exact: true })
    .fill("customer@example.com");
  await page.getByRole("button", { name: "Save service request" }).click();
  await expect(page.getByRole("dialog").getByRole("status")).toContainText(
    "Saved on this browser",
  );
  await page.goto("/admin");
  await page.getByRole("button", { name: "Service requests" }).click();
  await expect(page.locator("tbody")).toContainText("Test Customer");
  await page.getByRole("button", { name: "View Test Customer" }).click();
  await expect(page.getByRole("dialog")).toContainText("2 coaching hours");
});

test("Currency provider failure keeps USD and disables unavailable EUR requests", async ({
  page,
}) => {
  await page.route("**/api/exchange-rate", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.goto("/games/valorant");
  await expect(page.locator(".rate-note")).toContainText(
    "Exchange rate unavailable",
  );
  await expect(
    page.getByRole("button", { name: "Review your plan" }),
  ).toBeEnabled();
  await page
    .locator(".price-summary")
    .getByRole("button", { name: "EUR", exact: true })
    .click();
  await expect(page.locator(".converted-price")).toContainText(
    "EUR unavailable",
  );
  await expect(
    page.getByRole("button", { name: "Review your plan" }),
  ).toBeDisabled();
});

test("New pages have canonical metadata and admin is not indexed", async ({
  page,
  request,
}) => {
  for (const path of ["/services", "/careers"]) {
    await page.goto(path);
    await expect(page.locator("head link[rel='canonical']")).toHaveAttribute(
      "href",
      new RegExp(`${path}$`),
    );
    await expect(page.locator("head meta[name='description']")).toHaveAttribute(
      "content",
      /.+/,
    );
  }
  await page.goto("/admin");
  await expect(page.locator("head meta[name='robots']")).toHaveAttribute(
    "content",
    /noindex/,
  );
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/careers");
  expect(sitemap).not.toContain("/admin");
  expect(await (await request.get("/robots.txt")).text()).toContain(
    "Disallow: /admin",
  );
});
