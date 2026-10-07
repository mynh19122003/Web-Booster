import { chromium, expect } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = process.env.REVIEW_URL || "http://127.0.0.1:3107";
const development = process.env.REVIEW_MODE === "development";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [],
  requests = [],
  protocols = [];
const context = await browser.newContext({
  reducedMotion: "reduce",
  viewport: { width: 1440, height: 900 },
});
context.on("request", (r) => {
  const url = new URL(r.url());
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname === "localhost" ||
    (url.hostname === "127.0.0.1" && url.origin !== base)
  )
    requests.push(r.url());
});
const page = await context.newPage();
page.on("pageerror", (e) => errors.push(e.message));
const cdp = await context.newCDPSession(page);
await cdp.send("Page.enable");
cdp.on("Page.frameRequestedNavigation", (e) => {
  if (e.url.startsWith("ascendriot:")) protocols.push(e.url);
});
const go = async (path) => {
  await page.goto(base + path);
  await page.locator(".ap-content, .wf-login").first().waitFor();
};
const state = () =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem("ascend-order-flow-v1")).state,
  );
const writeState = async (change) => {
  await page.evaluate((change) => {
    const data = JSON.parse(localStorage.getItem("ascend-order-flow-v1"));
    const s = data.state;
    if (change.fixture) {
      const template = s.employees.find((e) => e.id === "emp-nova");
      s.employees.push({
        ...template,
        id: "emp-riot-poc",
        name: "Riot PoC",
        maxActiveOrders: 1,
        clientOpen: true,
        verified: true,
      });
    }
    if (change.status)
      s.orders.find((o) => o.id === "ASC-1047").status = change.status;
    if (change.employee)
      s.orders.find((o) => o.id === "ASC-1047").employeeId = change.employee;
    localStorage.setItem("ascend-order-flow-v1", JSON.stringify(data));
  }, change);
  await page.reload();
  await page.locator(".ap-content, .wf-login").first().waitFor();
};
const launch = () =>
  page.getByRole("button", { name: "MỞ RIOT CLIENT", exact: true });
const help = () =>
  page.getByRole("button", {
    name: "Hướng dẫn thiết lập",
    exact: true,
  });
const checkOverflow = async () => {
  const fits = await page.evaluate(
    () => document.documentElement.scrollWidth <= innerWidth + 1,
  );
  if (!fits) throw new Error("Page overflow");
};
try {
  await go("/employee/login");
  if (development) {
    const before = await state();
    await page.getByText("Chuẩn bị nhân viên Riot PoC (Development)").click();
    const after = await state();
    if (JSON.stringify(before.orders) !== JSON.stringify(after.orders))
      throw new Error("Development fixture modified existing orders");
  } else {
    await expect(
      page.getByText("Chuẩn bị nhân viên Riot PoC (Development)"),
    ).toHaveCount(0);
    // Isolated browser fixture: preserve all orders/mocks in this test context.
    await writeState({ fixture: true });
  }
  await page.locator("select").selectOption("emp-riot-poc");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(base + "/employee");
  await go("/employee/orders/ASC-1047");
  await expect(launch()).toBeDisabled();
  await expect(
    page.getByText(
      "Bạn cần nhận đơn trước khi có thể trò chuyện với khách hàng.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Bạn cần nhận đơn trước khi có thể sử dụng Riot Client.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".wf-composer")).toHaveCount(0);
  await go("/employee/orders/available");
  const card = page.locator(".wf-order-card").filter({ hasText: "ASC-1047" });
  await card.getByRole("button", { name: "NHẬN ĐƠN", exact: true }).click();
  const modal = page.locator("dialog[open]");
  await expect(modal.getByText("Khu vực", { exact: true })).toBeVisible();
  await modal
    .getByRole("button", { name: "Xác nhận nhận đơn", exact: true })
    .dblclick();
  await expect(page).toHaveURL(base + "/employee/orders/ASC-1047");
  await expect(
    page.getByText("Nhận đơn thành công.", { exact: true }),
  ).toBeVisible();
  const claimed = await state();
  const order = claimed.orders.find((o) => o.id === "ASC-1047");
  if (
    order.status !== "IN_PROGRESS" ||
    order.employeeId !== "emp-riot-poc" ||
    !order.startedAt
  )
    throw new Error("Claim state inconsistent");
  const assignments = claimed.assignments.filter(
    (a) => a.orderId === order.id && a.employeeId === "emp-riot-poc",
  );
  if (assignments.length !== 1 || assignments[0].claimedAt !== order.startedAt)
    throw new Error("Duplicate or inconsistent assignment");
  await expect(launch()).toBeEnabled();
  await expect(page.locator(".wf-composer")).toBeVisible();
  await page.reload();
  await expect(launch()).toBeEnabled();
  if (
    (await state()).orders.find((o) => o.id === order.id).startedAt !==
    order.startedAt
  )
    throw new Error("Claim lost after refresh");
  await page
    .getByRole("textbox", { name: "Nội dung tin nhắn", exact: true })
    .fill("PoC claim persistence checked.");
  await page.getByRole("button", { name: "Gửi", exact: true }).click();
  await expect(
    page.getByText("PoC claim persistence checked.", { exact: true }),
  ).toBeVisible();
  await launch().click();
  await expect(
    page.getByText("Đã gửi yêu cầu mở Riot Client.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".riot-card")).toContainText("Chưa xác minh");
  await expect(page.locator(".riot-card")).not.toContainText("Đã kết nối");
  await expect(page.locator(".riot-card")).not.toContainText("Client đã mở");
  if (protocols.length !== 1 || protocols[0] !== "ascendriot://open/league")
    throw new Error("Launch URI is not the fixed click action");
  await go("/employee/orders/available");
  await expect(
    page.locator(".wf-order-card").filter({ hasText: "ASC-1047" }),
  ).toHaveCount(0);
  for (const b of await page
    .getByRole("button", { name: "NHẬN ĐƠN", exact: true })
    .all())
    await expect(b).toBeDisabled();
  await expect(page.locator(".wf-capacity").first()).toContainText("1 / 1");
  console.log(
    "PASS: OPEN lock, claim/double click, redirect/toast, shared assignment/count/timeline, refresh, limit, chat, fixed URI, unverified client.",
  );

  await go("/employee/orders/ASC-1047");
  await help().click();
  if (development)
    await expect(page.locator("dialog[open]")).toContainText(
      "Thiết lập Riot Launcher (Development)",
    );
  else
    await expect(page.locator("dialog[open]")).not.toContainText(
      "Thiết lập Riot Launcher (Development)",
    );
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(help()).toBeFocused();
  for (const width of [1920, 1440, 1366, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await checkOverflow();
    if (width === 1440 || width === 390)
      await page.screenshot({
        path: join(tmpdir(), `ascend-riot-poc-${width}.png`),
        fullPage: true,
      });
    await help().click();
    const fits = await page.locator("dialog[open]").evaluate((d) => {
      const r = d.getBoundingClientRect();
      return (
        r.left >= 0 &&
        r.right <= innerWidth + 1 &&
        r.top >= 0 &&
        r.bottom <= innerHeight + 1
      );
    });
    if (!fits) throw new Error("Help dialog outside viewport");
    await page.keyboard.press("Escape");
    await go("/employee/orders/available");
    await checkOverflow();
    await go("/employee/orders/ASC-1047");
  }
  for (const status of ["PENDING_REVIEW", "COMPLETED", "CANCELLED", "PAUSED"]) {
    await writeState({ status });
    await expect(launch()).toBeDisabled();
    await expect(page.locator(".wf-composer")).toHaveCount(0);
  }
  await writeState({ status: "IN_PROGRESS", employee: "emp-nova" });
  await expect(launch()).toHaveCount(0); // Existing privacy projection forbids other employees' detail.
  await expect(
    page.getByText("Không thể truy cập đơn", { exact: true }),
  ).toBeVisible();
  await writeState({ employee: "emp-riot-poc" });
  console.log(
    `PASS: non-active and other-employee gates, ${development ? "development fixture/help visible" : "production dev controls hidden"}, keyboard focus, six responsive widths.`,
  );
  for (const userAgent of [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/140.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
  ]) {
    const foreign = await browser.newContext({
      userAgent,
      viewport: { width: 390, height: 844 },
    });
    const p = await foreign.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base + "/employee/login");
    await p.locator(".wf-login").waitFor();
    await p.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await expect(p).toHaveURL(base + "/employee");
    await p.goto(base + "/employee/orders/ASC-1042");
    await expect(
      p.getByText("Tính năng mở client hiện chỉ hỗ trợ Windows.", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      p.getByRole("button", { name: "MỞ RIOT CLIENT", exact: true }),
    ).toBeDisabled();
    await foreign.close();
  }
  // Malformed persisted mock must recover without a page/hydration error.
  await page.evaluate(() =>
    localStorage.setItem("ascend-order-flow-v1", "{broken"),
  );
  await page.reload();
  await page.locator(".wf-login, .ap-content").first().waitFor();
  await page.evaluate(() =>
    localStorage.setItem(
      "ascend-order-flow-v1",
      JSON.stringify({
        state: { initialized: true, orders: null },
        version: 0,
      }),
    ),
  );
  await page.reload();
  await page.locator(".wf-login").waitFor();
  if (errors.length || requests.length)
    throw new Error(JSON.stringify({ errors, requests }));
  console.log(
    "PASS: mobile/macOS disabled, malformed storage recovery, zero page errors and API/localhost calls. Browser request only; native client NOT_RUN.",
  );
} finally {
  await browser.close();
}
