"use client";
import { useEffect } from "react";
import { useWorkflow as store, type WorkflowState } from "@/lib/workflow/store";
import { workflowFixtures } from "@/mocks/workflow";
import { can } from "@/services/admin";
import { useAdminStore } from "@/lib/admin/store";
import type { Permission } from "@/types/admin";
import type {
  Order,
  AvailableOrder,
  Employee,
  ComplaintReason,
  ComplaintStatus,
  EmployeeTransaction,
} from "@/types/workflow";

// Local review implementation only. These interfaces do not define HTTP endpoints.
export interface EmployeeOrderService {
  getAvailableOrders(): AvailableOrder[];
  getOrder(id: string): Order | AvailableOrder;
  claimOrder(id: string): Promise<Order>;
  updateProgress(id: string, progress: number, note: string): Promise<void>;
  completeOrder(id: string): Promise<void>;
  reportIssue(id: string, reason: string, description: string): Promise<void>;
}
export interface EmployeeService {
  setLimit(id: string, limit: 1 | 2): Promise<void>;
  setStatus(id: string, status: Employee["status"]): Promise<void>;
  updateProfile(phone: string, timezone: string): Promise<void>;
  openClient(): Promise<void>;
}
export class WorkflowError extends Error {
  constructor(
    public code:
      "ORDER_ALREADY_CLAIMED" | "ORDER_LIMIT" | "FORBIDDEN" | "INVALID_STATE",
    message: string,
  ) {
    super(message);
  }
}
export const activeStatuses = [
  "CLAIMED",
  "IN_PROGRESS",
  "PAUSED",
  "PENDING_REVIEW",
  "DISPUTED",
];
export const isActive = (o: Order) => activeStatuses.includes(o.status);
export const workload = (id: string, s = store.getState()) =>
  s.orders.filter((o) => o.employeeId === id && isActive(o)).length;
export const timestamp = () => new Date().toISOString();
const uid = () => crypto.randomUUID();
function admin(permission: Permission) {
  if (!can(permission))
    throw new WorkflowError(
      "FORBIDDEN",
      "Bạn không có quyền thực hiện thao tác này.",
    );
  return useAdminStore.getState().user!.displayName;
}
function employee() {
  const s = store.getState();
  const e = s.employees.find((x) => x.id === s.employeeId);
  if (
    !e ||
    e.status !== "ACTIVE" ||
    !s.sessions.some(
      (x) => x.id === s.employeeSessionId && x.status === "ACTIVE",
    )
  )
    throw new WorkflowError(
      "FORBIDDEN",
      "Phiên làm việc không còn hiệu lực. Vui lòng đăng nhập lại.",
    );
  return e;
}
function order(id: string) {
  const o = store.getState().orders.find((o) => o.id === id);
  if (!o) throw new WorkflowError("INVALID_STATE", "Không tìm thấy đơn hàng.");
  return o;
}
function eligible(e: Employee, o: Order) {
  return (
    e.status === "ACTIVE" &&
    e.games.includes(o.game) &&
    e.type === (o.service === "Coaching" ? "COACH" : "BOOSTER")
  );
}
function publicOrder(o: Order): AvailableOrder {
  const {
    id,
    game,
    service,
    status,
    currentRank,
    targetRank,
    region,
    estimatedDuration,
    reward,
    options,
    createdAt,
    difficulty,
  } = o;
  return {
    id,
    game,
    service,
    status,
    currentRank,
    targetRank,
    region,
    estimatedDuration,
    reward,
    options,
    createdAt,
    difficulty,
  };
}
function log(
  s: WorkflowState,
  title: string,
  detail: string,
  actor: string,
  orderId?: string,
  employeeId?: string,
) {
  return [
    ...s.activities,
    { id: uid(), title, detail, actor, orderId, employeeId, at: timestamp() },
  ];
}
function patchOrder(
  id: string,
  patch: Partial<Order>,
  title: string,
  detail: string,
  actor: string,
) {
  store.setState((s) => ({
    orders: s.orders.map((o) =>
      o.id === id ? { ...o, ...patch, updatedAt: timestamp() } : o,
    ),
    activities: log(s, title, detail, actor, id, order(id).employeeId),
  }));
}
let initialization: Promise<void> | undefined;
export function initializeWorkflow() {
  return (initialization ??= (async () => {
    const identity = JSON.parse(
      sessionStorage.getItem("ascend-employee-identity") || "null",
    ) as { id: string; session: string } | null;
    await store.persist.rehydrate();
    if (!store.getState().initialized)
      store.setState({ ...workflowFixtures(), initialized: true });
    store.setState({
      ready: true,
      employeeId: identity?.id ?? null,
      employeeSessionId: identity?.session ?? null,
    });
  })());
}
export function useWorkflowReady() {
  const ready = store((s) => s.ready);
  useEffect(() => {
    void initializeWorkflow();
    const sync = (event: StorageEvent) => {
      if (event.key !== "ascend-order-flow-v1" || !event.newValue) return;
      const identity = {
        employeeId: store.getState().employeeId,
        employeeSessionId: store.getState().employeeSessionId,
      };
      const state = JSON.parse(event.newValue).state as WorkflowState;
      store.setState({ ...state, ...identity, ready: true });
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  return ready;
}
export const employeeAuthMockService = {
  async login(id: string) {
    const s = store.getState();
    const e = s.employees.find((e) => e.id === id && e.status === "ACTIVE");
    if (!e) throw new Error("Tài khoản không hoạt động.");
    const session = uid();
    sessionStorage.setItem(
      "ascend-employee-identity",
      JSON.stringify({ id, session }),
    );
    store.setState({
      employeeId: id,
      employeeSessionId: session,
      sessions: [
        ...s.sessions,
        {
          id: session,
          employeeId: id,
          ip: e.currentIp,
          device: e.device,
          userAgent: e.userAgent,
          loginAt: timestamp(),
          lastActivityAt: timestamp(),
          status: "ACTIVE",
        },
      ],
      employees: s.employees.map((x) =>
        x.id === id
          ? {
              ...x,
              online: true,
              lastLogin: timestamp(),
              lastActivity: timestamp(),
            }
          : x,
      ),
    });
  },
  logout() {
    const id = store.getState().employeeSessionId;
    sessionStorage.removeItem("ascend-employee-identity");
    store.setState((s) => ({
      employeeId: null,
      employeeSessionId: null,
      sessions: s.sessions.map((x) =>
        x.id === id ? { ...x, status: "REVOKED" } : x,
      ),
    }));
  },
};
export const orderMockService: EmployeeOrderService = {
  getAvailableOrders() {
    const e = employee();
    return store
      .getState()
      .orders.filter((o) => o.status === "OPEN" && eligible(e, o))
      .map(publicOrder);
  },
  getOrder(id) {
    const e = employee();
    const o = order(id);
    if (o.employeeId === e.id) return o;
    if (o.status === "OPEN" && eligible(e, o)) return publicOrder(o);
    throw new WorkflowError(
      "FORBIDDEN",
      "Bạn không có quyền xem đơn hàng này.",
    );
  },
  async claimOrder(id) {
    // Web Locks serialize competing tabs. Re-read the shared state inside the lock.
    const claim = async () => {
      const identity = {
        employeeId: store.getState().employeeId,
        employeeSessionId: store.getState().employeeSessionId,
      };
      const saved = localStorage.getItem("ascend-order-flow-v1");
      if (saved)
        store.setState({
          ...JSON.parse(saved).state,
          ...identity,
          ready: true,
        });
      const e = employee();
      const o = order(id);
      const s = store.getState();
      if (o.status !== "OPEN" || o.employeeId)
        throw new WorkflowError(
          "ORDER_ALREADY_CLAIMED",
          "Đơn hàng vừa được nhân viên khác nhận.",
        );
      if (!eligible(e, o))
        throw new WorkflowError(
          "FORBIDDEN",
          "Bạn chưa đủ điều kiện nhận đơn này.",
        );
      if (workload(e.id) >= e.maxActiveOrders)
        throw new WorkflowError(
          "ORDER_LIMIT",
          "Bạn đã đạt giới hạn đơn hàng đang thực hiện.",
        );
      const at = timestamp();
      const existing = s.conversations.find((c) => c.orderId === id);
      const activities = log(
        s,
        "Nhận đơn",
        `${e.name} nhận đơn trước và giữ chỗ xử lý.`,
        e.name,
        id,
        e.id,
      );
      activities.push({
        id: uid(),
        title: "Bắt đầu",
        detail: "Đơn chuyển sang đang thực hiện; trò chuyện được mở.",
        actor: e.name,
        orderId: id,
        employeeId: e.id,
        at,
      });
      store.setState({
        orders: s.orders.map((x) =>
          x.id === id
            ? {
                ...x,
                status: "IN_PROGRESS",
                employeeId: e.id,
                startedAt: at,
                updatedAt: at,
              }
            : x,
        ),
        assignments: [
          ...s.assignments,
          {
            id: uid(),
            orderId: id,
            employeeId: e.id,
            status: "ACTIVE",
            claimedAt: at,
            startedAt: at,
            actor: e.name,
          },
        ],
        activities,
        conversations: existing
          ? s.conversations
          : [
              ...s.conversations,
              {
                id: `chat-${id}`,
                orderId: id,
                participant: {
                  id: o.customer.id,
                  name: o.customer.name,
                  role: "CUSTOMER",
                },
                unread: 0,
                archived: false,
                updatedAt: at,
              },
            ],
      });
      return order(id);
    };
    if (navigator.locks)
      return navigator.locks.request("ascend-order-claim", claim);
    return claim();
  },
  async updateProgress(id, progress, note) {
    const e = employee();
    const o = order(id);
    if (o.employeeId !== e.id || o.status !== "IN_PROGRESS")
      throw new Error("Chỉ cập nhật đơn đang thực hiện của bạn.");
    if (!Number.isFinite(progress) || progress < o.progress || progress > 100)
      throw new Error("Tiến độ phải tăng và nằm trong khoảng 0–100%.");
    patchOrder(
      id,
      { progress },
      "Cập nhật tiến độ",
      `${progress}% · ${note.slice(0, 2000)}`,
      e.name,
    );
  },
  async completeOrder(id) {
    const e = employee();
    const o = order(id);
    if (o.employeeId !== e.id || o.status !== "IN_PROGRESS")
      throw new Error("Chỉ hoàn tất đơn đang thực hiện của bạn.");
    patchOrder(
      id,
      { status: "PENDING_REVIEW", progress: 100 },
      "Hoàn tất công việc",
      "Đang chờ khách hàng xác nhận.",
      e.name,
    );
  },
  async reportIssue(id, reason, description) {
    const e = employee();
    const o = order(id);
    if (o.employeeId !== e.id || !isActive(o))
      throw new Error("Không thể báo vấn đề cho đơn này.");
    if (!reason || description.trim().length < 10)
      throw new Error("Vui lòng mô tả vấn đề ít nhất 10 ký tự.");
    store.setState((s) => ({
      issues: [
        ...s.issues,
        {
          id: uid(),
          employeeId: e.id,
          orderId: id,
          reason,
          description: description.trim().slice(0, 2000),
          at: timestamp(),
          status: "OPEN",
        },
      ],
      activities: log(
        s,
        "Báo vấn đề",
        `${reason}: ${description}`,
        e.name,
        id,
        e.id,
      ),
    }));
  },
};
export const employeeMockService: EmployeeService = {
  async updateProfile(phone, timezone) {
    const e = employee();
    if (
      phone.length > 30 ||
      !["Asia/Ho_Chi_Minh", "Asia/Bangkok"].includes(timezone)
    )
      throw new Error("Thông tin hồ sơ không hợp lệ.");
    store.setState((s) => ({
      employees: s.employees.map((x) =>
        x.id === e.id ? { ...x, phone, timezone } : x,
      ),
      activities: log(
        s,
        "Cập nhật hồ sơ",
        "Thông tin liên hệ đã được cập nhật.",
        e.name,
        undefined,
        e.id,
      ),
    }));
  },
  async openClient() {
    const e = employee();
    store.setState((s) => ({
      employees: s.employees.map((x) =>
        x.id === e.id ? { ...x, clientOpen: true } : x,
      ),
    }));
  },
  async setLimit(id, limit) {
    const actor = admin("employee.manage");
    if (![1, 2].includes(limit))
      throw new Error("Giới hạn chỉ được là 1 hoặc 2 đơn.");
    if (workload(id) > limit)
      throw new Error("Hãy xử lý đơn hiện tại trước khi giảm giới hạn.");
    store.setState((s) => ({
      employees: s.employees.map((e) =>
        e.id === id ? { ...e, maxActiveOrders: limit } : e,
      ),
      activities: log(
        s,
        "Cập nhật giới hạn",
        `${limit} đơn hoạt động`,
        actor,
        undefined,
        id,
      ),
    }));
  },
  async setStatus(id, status) {
    const actor = admin("employee.manage");
    store.setState((s) => ({
      employees: s.employees.map((e) =>
        e.id === id
          ? { ...e, status, online: status === "ACTIVE" && e.online }
          : e,
      ),
      sessions: s.sessions.map((x) =>
        x.employeeId === id && status === "SUSPENDED"
          ? { ...x, status: "REVOKED" }
          : x,
      ),
      activities: log(
        s,
        status === "ACTIVE" ? "Kích hoạt tài khoản" : "Đình chỉ tài khoản",
        id,
        actor,
        undefined,
        id,
      ),
    }));
  },
};
export const assignmentMockService = {
  async assign(id: string, employeeId: string) {
    const actor = admin("order.assign");
    const o = order(id);
    const s = store.getState();
    const e = s.employees.find((x) => x.id === employeeId);
    if (
      !e ||
      !eligible(e, o) ||
      workload(employeeId) >= e.maxActiveOrders ||
      o.employeeId === employeeId
    )
      throw new Error("Nhân viên không đủ điều kiện hoặc đã đạt giới hạn.");
    if (
      !["OPEN", "CLAIMED", "IN_PROGRESS", "PAUSED", "DISPUTED"].includes(
        o.status,
      )
    )
      throw new Error("Không thể phân công đơn ở trạng thái này.");
    const at = timestamp();
    store.setState({
      assignments: [
        ...s.assignments.map((a) =>
          a.orderId === id && !a.endedAt
            ? { ...a, status: "REASSIGNED" as const, endedAt: at }
            : a,
        ),
        {
          id: uid(),
          orderId: id,
          employeeId,
          status: "ACTIVE",
          claimedAt: at,
          startedAt: at,
          actor,
        },
      ],
      orders: s.orders.map((x) =>
        x.id === id
          ? {
              ...x,
              employeeId,
              status: "IN_PROGRESS",
              startedAt: at,
              updatedAt: at,
            }
          : x,
      ),
      activities: log(
        s,
        o.employeeId ? "Phân công lại" : "Phân công",
        `${e.name} phụ trách đơn`,
        actor,
        id,
        employeeId,
      ),
      conversations: s.conversations.some((c) => c.orderId === id)
        ? s.conversations
        : [
            ...s.conversations,
            {
              id: `chat-${id}`,
              orderId: id,
              participant: {
                id: o.customer.id,
                name: o.customer.name,
                role: "CUSTOMER",
              },
              unread: 0,
              archived: false,
              updatedAt: at,
            },
          ],
    });
  },
  async remove(id: string) {
    const actor = admin("order.assign");
    const o = order(id);
    if (!o.employeeId || !isActive(o))
      throw new Error("Đơn không có phân công đang hiệu lực.");
    store.setState((s) => ({
      assignments: s.assignments.map((a) =>
        a.orderId === id && !a.endedAt
          ? { ...a, status: "REMOVED", endedAt: timestamp() }
          : a,
      ),
    }));
    patchOrder(
      id,
      { employeeId: undefined, status: "OPEN" },
      "Gỡ phân công",
      "Đơn trở lại danh sách có thể nhận.",
      actor,
    );
  },
};
export const adminOrderMockService = {
  async action(
    id: string,
    action: "pause" | "resume" | "cancel" | "complete" | "payment" | "refund",
    reason: string,
    amount = 0,
  ) {
    const actor = admin(
      action === "refund"
        ? "finance.manage"
        : action === "cancel"
          ? "order.cancel"
          : "order.update",
    );
    const o = order(id);
    if (reason.trim().length < 5)
      throw new Error("Vui lòng nhập lý do ít nhất 5 ký tự.");
    if (action === "pause" && o.status !== "IN_PROGRESS")
      throw new Error("Chỉ tạm dừng đơn đang thực hiện.");
    if (action === "resume" && (o.status !== "PAUSED" || !o.employeeId))
      throw new Error("Đơn tạm dừng cần có nhân viên trước khi tiếp tục.");
    if (action === "payment" && o.status !== "PENDING_PAYMENT")
      throw new Error("Đơn không chờ thanh toán.");
    if (
      action === "complete" &&
      !["IN_PROGRESS", "PENDING_REVIEW"].includes(o.status)
    )
      throw new Error("Đơn chưa đủ điều kiện hoàn thành.");
    if (
      action === "cancel" &&
      ["COMPLETED", "CANCELLED", "REFUNDED"].includes(o.status)
    )
      throw new Error("Đơn đã đóng.");
    if (
      action === "refund" &&
      (o.status === "PENDING_PAYMENT" ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        amount > o.amount - o.refundedAmount)
    )
      throw new Error("Số tiền hoàn không hợp lệ.");
    const status =
      action === "pause"
        ? "PAUSED"
        : action === "resume"
          ? "IN_PROGRESS"
          : action === "cancel"
            ? "CANCELLED"
            : action === "complete"
              ? "COMPLETED"
              : action === "payment"
                ? "OPEN"
                : o.refundedAmount + amount === o.amount
                  ? "REFUNDED"
                  : o.status;
    const at = timestamp();
    if (action === "complete" && o.employeeId) {
      store.setState((s) => ({
        employees: s.employees.map((e) =>
          e.id === o.employeeId
            ? { ...e, completedOrders: e.completedOrders + 1 }
            : e,
        ),
        transactions: [
          ...s.transactions,
          {
            id: uid(),
            employeeId: o.employeeId!,
            orderId: id,
            type: "EARNING",
            amount: o.reward,
            reason: "Dịch vụ đã hoàn thành và được xác nhận.",
            admin: actor,
            at,
          },
        ],
      }));
    }
    if (["COMPLETED", "CANCELLED", "REFUNDED"].includes(status))
      store.setState((s) => ({
        assignments: s.assignments.map((a) =>
          a.orderId === id && !a.endedAt
            ? {
                ...a,
                endedAt: at,
                status: status === "COMPLETED" ? "COMPLETED" : "REMOVED",
              }
            : a,
        ),
      }));
    patchOrder(
      id,
      {
        status,
        ...(action === "refund"
          ? { refundedAmount: o.refundedAmount + amount }
          : {}),
        ...(action === "complete" ? { progress: 100, completedAt: at } : {}),
      },
      {
        pause: "Tạm dừng",
        resume: "Tiếp tục",
        cancel: "Hủy đơn",
        complete: "Hoàn thành",
        payment: "Thanh toán thành công",
        refund: "Hoàn tiền",
      }[action],
      reason,
      actor,
    );
  },
};
export const chatMockService = {
  getEmployeeConversations() {
    const e = employee();
    const s = store.getState();
    return s.conversations.filter(
      (c) =>
        s.orders.some((o) => o.id === c.orderId && o.employeeId === e.id) &&
        s.assignments.some(
          (a) => a.orderId === c.orderId && a.employeeId === e.id,
        ),
    );
  },
  getEmployeeMessages(id: string) {
    if (!this.getEmployeeConversations().some((c) => c.id === id))
      throw new Error("Không có quyền xem cuộc trò chuyện.");
    return store
      .getState()
      .messages.filter(
        (m) => m.conversationId === id && m.channel === "CUSTOMER",
      );
  },
  async send(
    id: string,
    body: string,
    channel: "CUSTOMER" | "INTERNAL",
    mode: "admin" | "employee",
  ) {
    const s = store.getState();
    const c = s.conversations.find((c) => c.id === id);
    if (!c || c.archived) throw new Error("Cuộc trò chuyện đã đóng.");
    let sender;
    if (mode === "employee") {
      const e = employee();
      const o = order(c.orderId);
      if (channel !== "CUSTOMER" || o.employeeId !== e.id || !isActive(o))
        throw new Error(
          "Bạn không còn quyền gửi tin nhắn trong cuộc trò chuyện này.",
        );
      sender = { id: e.id, name: e.name, role: "EMPLOYEE" as const };
    } else {
      const name = admin("chat.send");
      admin("chat.view");
      sender = {
        id: useAdminStore.getState().user!.id,
        name,
        role: "ADMIN" as const,
      };
    }
    if (!body.trim() || body.length > 4000)
      throw new Error("Nhập tin nhắn từ 1 đến 4.000 ký tự.");
    const at = timestamp();
    store.setState({
      messages: [
        ...s.messages,
        {
          id: uid(),
          conversationId: id,
          sender,
          body: body.trim(),
          channel,
          at,
          read: false,
        },
      ],
      conversations: s.conversations.map((x) =>
        x.id === id
          ? {
              ...x,
              updatedAt: at,
              unread: mode === "employee" ? x.unread + 1 : x.unread,
            }
          : x,
      ),
      activities: log(
        s,
        channel === "INTERNAL" ? "Ghi chú nội bộ" : "Gửi tin nhắn",
        `Cuộc trò chuyện #${c.orderId}`,
        sender.name,
        c.orderId,
        mode === "employee" ? sender.id : undefined,
      ),
      employees: s.employees.map((e) =>
        e.id === sender.id ? { ...e, lastActivity: at } : e,
      ),
      sessions: s.sessions.map((x) =>
        x.id === s.employeeSessionId && mode === "employee"
          ? { ...x, lastActivityAt: at }
          : x,
      ),
    });
  },
};
export const complaintMockService = {
  async create(
    orderId: string,
    reason: ComplaintReason,
    description: string,
    evidence: string[],
  ) {
    const o = order(orderId);
    // Customer entry is a reusable local review form, not a customer API adapter.
    if (
      !["IN_PROGRESS", "PAUSED", "PENDING_REVIEW", "COMPLETED"].includes(
        o.status,
      ) ||
      !description.trim() ||
      !(
        reason in
        {
          ORDER_FAILED: 1,
          RANK_LOST: 1,
          EMPLOYEE_BEHAVIOR: 1,
          NO_PROGRESS: 1,
          WRONG_SERVICE: 1,
          ACCOUNT_ISSUE: 1,
          OTHER: 1,
        }
      )
    )
      throw new Error("Không thể gửi khiếu nại cho đơn này.");
    if (
      store
        .getState()
        .complaints.some(
          (c) =>
            c.orderId === orderId &&
            ["OPEN", "UNDER_REVIEW"].includes(c.status),
        )
    )
      throw new Error("Đơn đã có khiếu nại đang xử lý.");
    const id = `KN-${uid().slice(0, 8).toUpperCase()}`;
    store.setState((s) => ({
      complaints: [
        ...s.complaints,
        {
          id,
          orderId,
          customerId: o.customer.id,
          employeeId: o.employeeId,
          reason,
          description,
          evidence,
          status: "OPEN",
          priority: "NORMAL",
          createdAt: timestamp(),
          adminNote: "",
          actions: [],
        },
      ],
    }));
    patchOrder(
      orderId,
      { status: "DISPUTED", complaintStatus: "OPEN" },
      "Gửi khiếu nại",
      description,
      o.customer.name,
    );
    return id;
  },
  async update(id: string, status: ComplaintStatus, note: string) {
    const actor = admin("complaint.manage");
    const c = store.getState().complaints.find((c) => c.id === id);
    if (!c || ["RESOLVED", "REJECTED"].includes(c.status))
      throw new Error("Khiếu nại đã đóng.");
    if (!note.trim()) throw new Error("Vui lòng ghi quyết định xử lý.");
    store.setState((s) => ({
      complaints: s.complaints.map((x) =>
        x.id === id
          ? {
              ...x,
              status,
              adminNote: note,
              resolvedAt: ["RESOLVED", "REJECTED"].includes(status)
                ? timestamp()
                : undefined,
              actions: [...x.actions, `${actor}: ${note}`],
            }
          : x,
      ),
    }));
    const o = order(c.orderId);
    patchOrder(
      c.orderId,
      {
        complaintStatus: status,
        ...(["RESOLVED", "REJECTED"].includes(status) && o.status === "DISPUTED"
          ? { status: o.employeeId ? "PAUSED" : "OPEN" }
          : {}),
      },
      "Xử lý khiếu nại",
      note,
      actor,
    );
  },
  async penalty(id: string, amount: number, reason: string, note: string) {
    const actor = admin("finance.manage");
    admin("complaint.manage");
    const c = store.getState().complaints.find((x) => x.id === id);
    if (
      !c?.employeeId ||
      !["OPEN", "UNDER_REVIEW"].includes(c.status) ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !reason.trim()
    )
      throw new Error("Thông tin xử phạt không hợp lệ.");
    const transaction: EmployeeTransaction = {
      id: uid(),
      employeeId: c.employeeId,
      orderId: c.orderId,
      complaintId: id,
      type: "PENALTY",
      amount: -amount,
      reason: `${reason}${note ? ` · ${note}` : ""}`,
      admin: actor,
      at: timestamp(),
    };
    store.setState((s) => ({
      transactions: [...s.transactions, transaction],
      complaints: s.complaints.map((x) =>
        x.id === id
          ? {
              ...x,
              actions: [
                ...x.actions,
                `${actor}: Trừ ${amount.toLocaleString("vi-VN")}đ · ${reason}`,
              ],
            }
          : x,
      ),
      activities: log(
        s,
        "Xử phạt",
        transaction.reason,
        actor,
        c.orderId,
        c.employeeId,
      ),
    }));
  },
};
export const securityMockService = {
  async revoke(id: string) {
    const actor = admin("employee.manage");
    store.setState((s) => ({
      sessions: s.sessions.map((x) =>
        x.employeeId === id ? { ...x, status: "REVOKED" } : x,
      ),
      activities: log(s, "Thu hồi phiên", id, actor, undefined, id),
    }));
  },
};
export const dashboardMockService = {
  getStats() {
    const s = store.getState();
    return {
      total: s.orders.length,
      open: s.orders.filter((o) => o.status === "OPEN").length,
      active: s.orders.filter((o) => o.status === "IN_PROGRESS").length,
      review: s.orders.filter((o) => o.status === "PENDING_REVIEW").length,
      complaints: s.complaints.filter((c) =>
        ["OPEN", "UNDER_REVIEW"].includes(c.status),
      ).length,
      online: s.employees.filter((e) => e.online && e.status === "ACTIVE")
        .length,
      working: s.employees.filter((e) => workload(e.id) > 0).length,
    };
  },
};
