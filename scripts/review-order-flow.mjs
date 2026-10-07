import { chromium, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.REVIEW_URL || "http://127.0.0.1:3106";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
const apiRequests = [];
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const watch = (page) => page.on("pageerror", (e) => errors.push(e.message));
context.on("request", (request) => {
  if (new URL(request.url()).pathname.startsWith("/api/"))
    apiRequests.push(request.url());
});
const employee = await context.newPage();
watch(employee);
const admin = await context.newPage();
watch(admin);
const go = async (page, path) => {
  await page.goto(base + path);
  await page.locator(".ap-content, .wf-login, .ap-auth").first().waitFor();
};
const dialog = (page) => page.locator("dialog[open]");
const modalFits = async (page) => {
  const fits = await dialog(page).evaluate((d) => {
    const r = d.getBoundingClientRect();
    const f = d.querySelector("footer").getBoundingClientRect();
    return (
      r.left >= 0 &&
      r.right <= innerWidth + 1 &&
      r.top >= 0 &&
      r.bottom <= innerHeight + 1 &&
      f.bottom <= innerHeight + 1
    );
  });
  if (!fits) throw new Error("Dialog or footer exceeds viewport");
};
const state = (page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem("ascend-order-flow-v1")).state,
  );
const submit = async (page, name = "Xác nhận") => {
  await dialog(page).getByRole("button", { name, exact: true }).click();
  await expect(dialog(page)).toHaveCount(0);
};
try {
  await go(employee, "/employee/login");
  await employee
    .getByRole("button", { name: "Đăng nhập", exact: true })
    .click();
  await expect(employee).toHaveURL(base + "/employee");
  await go(employee, "/employee/orders/available");
  await expect(
    employee.getByRole("button", { name: "NHẬN ĐƠN", exact: true }).first(),
  ).toBeDisabled();
  if (
    (await employee.locator(".ap-content").innerText()).includes("@example.com")
  )
    throw new Error("Customer email exposed before claim");
  console.log("B: Default limit enforced; pre-claim privacy verified.");

  await go(admin, "/admin/login");
  await admin.locator('input[name="password"]').fill("review-only-123");
  await admin
    .locator("form")
    .getByRole("button", { name: "Đăng nhập", exact: true })
    .click();
  await expect(admin).toHaveURL(base + "/admin");
  await go(admin, "/admin/employees/emp-nova");
  await admin
    .getByRole("button", { name: "Cập nhật giới hạn", exact: true })
    .click();
  await dialog(admin).locator('select[name="limit"]').selectOption("2");
  await submit(admin);
  await expect(
    employee.getByRole("button", { name: "NHẬN ĐƠN", exact: true }).first(),
  ).toBeEnabled();
  console.log("C: Admin grant 1 → 2 propagates to employee tab.");
  await employee.setViewportSize({ width: 390, height: 844 });

  const card = employee
    .locator(".wf-order-card")
    .filter({ hasText: "ASC-1047" });
  await card.getByRole("button", { name: "NHẬN ĐƠN", exact: true }).click();
  await modalFits(employee);
  await submit(employee, "Xác nhận nhận đơn");
  await expect(employee).toHaveURL(base + "/employee/orders/ASC-1047");
  await expect(employee.locator(".wf-composer")).toBeVisible();
  await expect(
    employee.getByRole("button", { name: "Hủy đơn", exact: true }),
  ).toHaveCount(0);
  await employee
    .getByRole("button", { name: "Cập nhật tiến độ", exact: true })
    .click();
  await dialog(employee).locator('select[name="progress"]').selectOption("50");
  await modalFits(employee);
  await dialog(employee)
    .locator('textarea[name="note"]')
    .fill("Đã hoàn tất phiên chơi đầu tiên.");
  await submit(employee);
  await employee
    .getByRole("button", { name: "BÁO VẤN ĐỀ", exact: true })
    .click();
  await dialog(employee)
    .locator('textarea[name="note"]')
    .fill("Khách hàng chưa phản hồi thời gian chơi tiếp theo.");
  await modalFits(employee);
  await submit(employee, "Gửi cho Admin");
  await go(admin, "/admin/orders/ASC-1047");
  await expect(
    admin
      .getByText("Khách hàng chưa phản hồi thời gian chơi tiếp theo.", {
        exact: true,
      })
      .first(),
  ).toBeVisible();
  console.log("D: Issue report appears in Admin order detail.");
  await employee
    .getByRole("button", { name: "HOÀN THÀNH ĐƠN", exact: true })
    .click();
  await submit(employee);
  const completed = (await state(employee)).orders.find(
    (o) => o.id === "ASC-1047",
  );
  if (completed.status !== "PENDING_REVIEW")
    throw new Error("Employee bypassed customer review");
  console.log("A: Claim → chat → progress → pending review verified.");
  await employee.setViewportSize({ width: 1440, height: 900 });

  await go(admin, "/admin/chat?conversation=chat-ASC-1042");
  await expect(admin.locator(".wf-chat-header")).toContainText("Mynh Dat");
  await expect(admin.locator(".wf-chat-context")).toContainText("Nova");
  await expect(admin.locator(".wf-chat-context")).toContainText("203.0.113.20");
  await admin
    .getByRole("button", { name: "Ghi chú nội bộ", exact: true })
    .click();
  await admin
    .getByRole("textbox", { name: "Ghi chú nội bộ", exact: true })
    .fill("Chỉ quản trị viên được thấy ghi chú này.");
  await admin
    .getByRole("button", { name: "Thêm ghi chú", exact: true })
    .click();
  await go(employee, "/employee/chat?conversation=chat-ASC-1042");
  await expect(employee.locator(".ap-content")).not.toContainText(
    "Chỉ quản trị viên được thấy ghi chú này.",
  );
  console.log(
    "F: Admin monitors relationship/session; internal notes hidden from employee.",
  );

  await go(admin, "/admin/complaints/KN-1001");
  await admin.setViewportSize({ width: 390, height: 844 });
  await admin
    .getByRole("button", { name: "Trừ tiền nhân viên", exact: true })
    .click();
  await dialog(admin).locator('input[name="amount"]').fill("200000");
  await modalFits(admin);
  await dialog(admin)
    .getByRole("button", { name: "Kiểm tra quyết định", exact: true })
    .click();
  await expect(dialog(admin).getByRole("heading")).toContainText("200.000đ");
  await modalFits(admin);
  await submit(admin, "Xác nhận xử phạt");
  await admin
    .getByRole("button", { name: "Giải quyết khiếu nại", exact: true })
    .click();
  await dialog(admin)
    .locator('textarea[name="note"]')
    .fill("Đã kiểm tra bằng chứng và ghi nhận phương án hỗ trợ.");
  await modalFits(admin);
  await submit(admin, "Xác nhận quyết định");
  const afterPenalty = await state(admin);
  if (
    !afterPenalty.transactions.some(
      (t) => t.complaintId === "KN-1001" && t.amount === -200000,
    )
  )
    throw new Error("Penalty missing from ledger");
  if (afterPenalty.complaints[0].status !== "RESOLVED")
    throw new Error("Complaint resolution missing");
  console.log("E: Two-step penalty and complaint resolution recorded.");
  await go(admin, "/admin/orders/ASC-1040");
  await admin
    .getByRole("button", { name: "Phân công / Phân công lại", exact: true })
    .click();
  await modalFits(admin);
  await dialog(admin).getByRole("button", { name: "Hủy", exact: true }).click();
  await admin.setViewportSize({ width: 1440, height: 900 });

  // Free the active slots via Admin; exercise two claimants with dialogs open.
  for (const id of ["ASC-1043", "ASC-1038"]) {
    await go(admin, `/admin/orders/${id}`);
    const remove = admin.getByRole("button", {
      name: "Gỡ phân công",
      exact: true,
    });
    if (await remove.count()) {
      await remove.click();
      await submit(admin);
    }
  }
  await go(admin, "/admin/orders/ASC-1047");
  await admin.getByRole("button", { name: "Hoàn thành", exact: true }).click();
  await dialog(admin)
    .locator('textarea[name="reason"]')
    .fill("Khách hàng đã xác nhận kết quả.");
  await submit(admin);
  const second = await context.newPage();
  watch(second);
  await go(second, "/employee/login");
  await second.locator("select").selectOption("emp-zen");
  await second.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(second).toHaveURL(base + "/employee");
  await go(employee, "/employee/orders/available");
  await go(second, "/employee/orders/available");
  for (const p of [employee, second])
    await p
      .locator(".wf-order-card")
      .filter({ hasText: "ASC-1043" })
      .getByRole("button", { name: "NHẬN ĐƠN", exact: true })
      .click();
  await submit(employee, "Xác nhận nhận đơn");
  await dialog(second)
    .getByRole("button", { name: "Xác nhận nhận đơn", exact: true })
    .click();
  await expect(dialog(second)).toContainText(
    "Đơn hàng vừa được nhân viên khác nhận.",
  );
  await expect(
    second.locator(".wf-order-card").filter({ hasText: "ASC-1043" }),
  ).toHaveCount(0);
  console.log(
    "Conflict: second claimant rejected and order removed from list.",
  );
  await second.close();

  // Responsive sweep measures document overflow and dialog/footer bounds.
  const sizes = [
    [1920, 1080],
    [1600, 900],
    [1440, 900],
    [1366, 768],
    [1280, 720],
    [1024, 768],
    [768, 1024],
    [390, 844],
  ];
  const routes = [
    "/admin/orders",
    "/admin/employees/emp-nova",
    "/admin/chat",
    "/admin/complaints/KN-1001",
  ];
  await mkdir("artifacts/order-flow", { recursive: true });
  for (const [width, height] of sizes) {
    await admin.setViewportSize({ width, height });
    for (const route of routes) {
      await go(admin, route);
      const overflow = await admin.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      if (overflow)
        throw new Error(`Horizontal page overflow: ${width} ${route}`);
    }
    await employee.setViewportSize({ width, height });
    await go(employee, "/employee/orders/available");
    if (
      await employee.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      )
    )
      throw new Error(`Employee overflow at ${width}`);
    await go(admin, "/admin/employees/emp-nova");
    await admin
      .getByRole("button", { name: "Cập nhật giới hạn", exact: true })
      .click();
    const bounds = await dialog(admin).evaluate((d) => {
      const r = d.getBoundingClientRect();
      const f = d.querySelector("footer").getBoundingClientRect();
      return {
        valid:
          r.left >= 0 &&
          r.right <= innerWidth + 1 &&
          r.top >= 0 &&
          r.bottom <= innerHeight + 1 &&
          f.bottom <= innerHeight + 1,
      };
    });
    if (!bounds.valid) throw new Error(`Dialog overflow at ${width}`);
    await dialog(admin)
      .getByRole("button", { name: "Hủy", exact: true })
      .click();
  }
  await admin.setViewportSize({ width: 1440, height: 900 });
  await go(admin, "/admin/complaints/KN-1001");
  await admin.screenshot({
    path: "artifacts/order-flow/admin-complaint.png",
    fullPage: true,
    animations: "disabled",
  });
  await employee.setViewportSize({ width: 390, height: 844 });
  await go(employee, "/employee/orders/available");
  await employee.screenshot({
    path: "artifacts/order-flow/employee-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  const viewer = await context.newPage();
  watch(viewer);
  await go(viewer, "/admin/login");
  await viewer
    .getByRole("button", { name: "Nhân sự chỉ xem", exact: true })
    .click();
  await viewer.locator('input[name="password"]').fill("review-only-123");
  await viewer
    .locator("form")
    .getByRole("button", { name: "Đăng nhập", exact: true })
    .click();
  await expect(viewer).toHaveURL(base + "/admin");
  await go(viewer, "/admin/employees/emp-nova");
  await expect(
    viewer.getByRole("button", { name: "Cập nhật giới hạn", exact: true }),
  ).toHaveCount(0);
  await go(viewer, "/admin/orders/ASC-1042");
  await expect(
    viewer.getByRole("button", { name: "Hủy đơn", exact: true }),
  ).toHaveCount(0);
  await expect(
    viewer.getByRole("button", { name: "Hoàn tiền", exact: true }),
  ).toHaveCount(0);
  await viewer.close();
  await go(admin, "/admin/employees/emp-nova");
  await admin
    .getByRole("button", { name: "Thu hồi toàn bộ phiên", exact: true })
    .click();
  await submit(admin);
  await expect(employee).toHaveURL(base + "/employee/login");
  if (apiRequests.length)
    throw new Error(`Unexpected API requests: ${apiRequests.join(", ")}`);
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "Permissions: Staff viewer restricted; Employee revocation enforced; zero API calls.",
  );
  console.log(
    "Responsive: 8 viewport sizes, 5 screens and limit dialog; no page errors.",
  );
} finally {
  await browser.close();
}
