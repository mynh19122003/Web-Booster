import { test, expect, type Page } from "@playwright/test";
const origin = "http://localhost:3108";
async function login(page: Page, email = "owner@example.test") {
  await page.goto("/admin/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill("ContractPass123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.locator(".ap-account-menu")).toContainText("Kiểm thử");
}
test("stale browser demo state cannot authenticate or restore records", async ({
  page,
}) => {
  await page.addInitScript(() => {
    for (const key of ["ascend-admin-demo-v2", "ascend-operations-demo-v2"])
      sessionStorage.setItem(
        key,
        JSON.stringify({
          state: {
            user: { id: "owner", role: "SUPER_ADMIN" },
            orders: [{ id: "ASC-1042" }],
          },
          version: 0,
        }),
      );
  });
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.locator('input[name="email"]')).toHaveValue("");
  await expect(page.locator(".ap-demo-switch")).toHaveCount(0);
  await page.locator('input[name="email"]').fill("owner@example.test");
  await page.locator('input[name="password"]').fill("InvalidPass123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.locator(".ap-error")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login$/);
});
for (const status of [401, 403, 404, 422, 429, 500]) {
  test(`login reports backend ${status} without entering workspace`, async ({
    page,
  }) => {
    await page.goto("/admin/login");
    await page
      .locator('input[name="email"]')
      .fill(`status${status}@example.test`);
    await page.locator('input[name="password"]').fill("ContractPass123!");
    const response = page.waitForResponse((r) =>
      r.url().endsWith("/api/admin/auth/login"),
    );
    await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    expect((await response).status()).toBe(status);
    await expect(page.locator(".ap-error")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login$/);
    expect(await page.context().cookies()).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "ascend_admin_session" }),
      ]),
    );
  });
}
test("lost backend connection produces a network error and no fake user", async ({
  page,
}) => {
  await page.goto("/admin/login");
  await page.locator('input[name="email"]').fill("network@example.test");
  await page.locator('input[name="password"]').fill("ContractPass123!");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.locator(".ap-error")).toContainText("Không thể kết nối");
  await expect(page.locator(".ap-account-menu")).toHaveCount(0);
});
test("BFF keeps credentials in an HttpOnly cookie, restores me and revokes logout", async ({
  request,
}) => {
  const response = await request.post("/api/admin/auth/login", {
    headers: { Origin: origin },
    data: { email: "owner@example.test", password: "ContractPass123!" },
  });
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({
    data: { role: "SUPER_ADMIN" },
  });
  expect(await response.text()).not.toContain("access_token");
  expect(response.headers()["set-cookie"]).toMatch(/HttpOnly/i);
  expect(response.headers()["set-cookie"]).toMatch(/SameSite=strict/i);
  expect((await request.get("/api/admin/auth/me")).status()).toBe(200);
  expect(
    (
      await request.post("/api/admin/auth/logout", {
        headers: { Origin: origin },
        data: {},
      })
    ).status(),
  ).toBe(200);
  expect((await request.get("/api/admin/auth/me")).status()).toBe(401);
});
test("BFF rejects non-admin, inactive, initial-password, malformed and cross-origin login", async ({
  request,
}) => {
  for (const [email, status] of [
    ["customer", 403],
    ["inactive", 403],
    ["initial", 403],
    ["invalid", 502],
  ] as const) {
    const response = await request.post("/api/admin/auth/login", {
      headers: { Origin: origin },
      data: { email: `${email}@example.test`, password: "ContractPass123!" },
    });
    expect(response.status()).toBe(status);
    expect(response.headers()["set-cookie"]).toBeUndefined();
  }
  expect(
    (
      await request.post("/api/admin/auth/login", {
        headers: { Origin: "https://another.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect((await request.get("/api/admin/auth/missing")).status()).toBe(404);
});
test("password failure preserves session; confirmed backend success clears it", async ({
  request,
}) => {
  const headers = { Origin: origin };
  await request.post("/api/admin/auth/login", {
    headers,
    data: { email: "owner@example.test", password: "ContractPass123!" },
  });
  expect(
    (
      await request.post("/api/admin/auth/change-password", {
        headers,
        data: {
          current_password: "wrong",
          password: "AnotherPass123!",
          password_confirmation: "AnotherPass123!",
        },
      })
    ).status(),
  ).toBe(422);
  expect((await request.get("/api/admin/auth/me")).status()).toBe(200);
  expect(
    (
      await request.post("/api/admin/auth/change-password", {
        headers,
        data: {
          current_password: "ContractPass123!",
          password: "AnotherPass123!",
          password_confirmation: "AnotherPass123!",
        },
      })
    ).status(),
  ).toBe(200);
  expect((await request.get("/api/admin/auth/me")).status()).toBe(401);
});
test("every admin route retains layout without demo data at desktop and mobile sizes", async ({
  page,
}) => {
  test.setTimeout(360000);
  const errors: string[] = [],
    paths: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().includes("/api/admin/")) paths.push(new URL(r.url()).pathname);
  });
  await login(page);
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
    for (const route of [
      "",
      "/orders",
      "/incoming-orders",
      "/assignments",
      "/orders/missing-order",
      "/chat",
      "/staff",
      "/staff/invitations",
      "/security",
      "/profile",
    ]) {
      await page.goto(`/admin${route}`);
      await expect(page.locator(".ap-workspace")).toBeVisible();
      await expect(page.locator(".ap-content")).not.toContainText(
        /DÙNG THỬ|dùng thử|ASC-1042|Mynh Dat|Olivia|Marcus|Sofia|session-screenshot|64%/,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${width}:${route}`,
      ).toBe(true);
      expect(
        await page
          .locator(".ap-brand img")
          .evaluateAll((images) =>
            images.every((img) => (img as HTMLImageElement).naturalWidth > 0),
          ),
      ).toBe(true);
      if (
        ["/orders", "/staff", "/staff/invitations", "/security"].includes(route)
      )
        await expect(page.locator(".ap-content table")).toBeVisible();
      if (["", "/orders"].includes(route)) {
        await expect(page.locator(".ap-stat").first()).toContainText("—");
        await expect(page.locator(".ap-stat strong").first()).not.toHaveText(
          /0/,
        );
      }
    }
  }
  expect(errors).toEqual([]);
  expect(
    paths.every((path) =>
      ["/api/admin/auth/login", "/api/admin/auth/me"].includes(path),
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/admin-data-cleanup-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/admin");
  await expect(page.locator(".ap-stat").first()).toContainText("—");
  await page.screenshot({
    path: "test-results/admin-data-cleanup-dashboard.png",
    fullPage: true,
  });
});
test("chat is empty and composer disabled; staff invitation form stays reviewable", async ({
  page,
}) => {
  await login(page);
  await page.goto("/admin/chat?order=missing-order");
  await expect(page.locator(".ap-date")).toContainText("—");
  await expect(page.locator(".op-conversation-rows")).toContainText(
    "Chưa có cuộc trò chuyện.",
  );
  await expect(
    page.getByRole("textbox", { name: "Nhập tin nhắn", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Gửi", exact: true }),
  ).toBeDisabled();
  await page.screenshot({
    path: "test-results/admin-data-cleanup-chat.png",
    fullPage: true,
  });
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
    await page.goto("/admin/staff/invitations?invite=1");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('button:not([type="button"])')).toBeDisabled();
    await expect(dialog).toContainText(
      "Chức năng sẽ khả dụng sau khi kết nối API.",
    );
    expect(
      await dialog.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return (
          r.left >= 0 &&
          r.top >= 0 &&
          r.right <= innerWidth + 1 &&
          r.bottom <= innerHeight + 1 &&
          el.scrollWidth <= el.clientWidth + 1
        );
      }),
    ).toBe(true);
    await expect(dialog.locator("footer")).toBeInViewport();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  }
});
test("staff permissions are taken from me; removed routes do not return demo pages", async ({
  page,
}) => {
  await login(page, "staff@example.test");
  await page.goto("/admin/staff");
  await expect(page.locator(".ap-content")).toContainText("Bạn không có quyền");
  await expect(page.locator('nav a[href="/admin/staff"]')).toHaveCount(0);
  await page.goto("/admin/employee-applications");
  await expect(
    page.getByRole("heading", {
      name: "Trang này không còn trong không gian quản trị.",
    }),
  ).toBeVisible();
  expect((await page.goto("/employee/orders"))?.status()).toBe(404);
});
test("invitation route has no preview token and only displays backend validation error", async ({
  page,
}) => {
  await page.goto("/admin/accept-invitation");
  await expect(page.locator('input[name="token"]')).toHaveValue("");
  await page.locator('input[name="token"]').fill("a".repeat(64));
  await page.locator('input[name="password"]').fill("ContractPass123!");
  await page.locator('input[name="confirmation"]').fill("ContractPass123!");
  await page
    .getByRole("button", { name: "Chấp nhận lời mời", exact: true })
    .click();
  await expect(page.locator(".ap-error")).toBeVisible();
  await expect(page.locator(".ap-accept-success")).toHaveCount(0);
});
test("failed me reports account error and never restores stale data", async ({
  page,
}) => {
  await page.request.post("/api/admin/auth/login", {
    headers: { Origin: origin },
    data: { email: "lost@example.test", password: "ContractPass123!" },
  });
  await page.goto("/admin/profile");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.locator(".ap-error")).toContainText(
    "Chưa tải được thông tin tài khoản.",
  );
  await expect(page.locator(".ap-error")).toContainText("Không thể kết nối");
});
test("closed backend port leaves login in an error state without fake content", async ({
  page,
  request,
}) => {
  await request.get("http://127.0.0.1:3109/shutdown");
  await page.goto("/admin/login");
  await page.locator('input[name="email"]').fill("owner@example.test");
  await page.locator('input[name="password"]').fill("ContractPass123!");
  const response = page.waitForResponse((r) =>
    r.url().endsWith("/api/admin/auth/login"),
  );
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  expect((await response).status()).toBe(502);
  await expect(page.locator(".ap-error")).toContainText("Không thể kết nối");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.locator(".ap-account-menu")).toHaveCount(0);
});
