"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Gamepad2 } from "lucide-react";
import { useWorkflow } from "@/lib/workflow/store";
import {
  orderService,
  employeeAuthService,
  isActive,
  employeeActiveOrders as workload,
  WorkflowError,
  employeeService,
} from "@/services/workflow-adapter";
import {
  PageHeader,
  FormModal,
  Field,
  EmptyState,
} from "@/components/admin/portal/Ui";
import { useEmployeeNotice } from "./EmployeeShell";
import {
  Badge,
  Facts,
  Panel,
  Stats,
  Progress,
  Timeline,
  money,
  date,
} from "./Shared";
import type { AvailableOrder } from "@/types/workflow";
import { WorkflowChat } from "./WorkflowChat";
import { RiotClientCard } from "./RiotClientCard";
import { employeeDemo } from "@/lib/workflow/demo";

export function EmployeeLogin() {
  const employees = useWorkflow((s) => s.employees);
  const router = useRouter();
  const [id, setId] = useState<string>(employeeDemo.id);
  const [error, setError] = useState("");
  return (
    <div className="wf-login">
      <Panel title="Chào mừng trở lại">
        <span className="ap-eyebrow">ASCEND · NHÂN VIÊN</span>
        <h1>Không gian làm việc của bạn.</h1>
        <p>Chọn tài khoản nhân viên để tiếp tục.</p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            try {
              if (id === employeeDemo.id) await employeeAuthService.loginDemo(employeeDemo.email, employeeDemo.password);
              else await employeeAuthService.login(id);
              router.push("/employee");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          <Field label="Tài khoản">
            <select value={id} onChange={(e) => setId(e.target.value)}>
              {employees.map((e) => (
                <option
                  key={e.id}
                  value={e.id}
                  disabled={e.status !== "ACTIVE"}
                >
                  {e.name} ·{" "}
                  {e.type === "COACH"
                    ? "Huấn luyện viên"
                    : "Chuyên viên nâng hạng"}
                </option>
              ))}
            </select>
          </Field>
          {error && (
            <p className="ap-error" role="alert">
              {error}
            </p>
          )}
          <button className="ap-button primary full">
            Đăng nhập <ArrowRight size={16} />
          </button>
        </form>
        <Link href="/admin/login">Trang quản trị ↗</Link>
        {process.env.NODE_ENV === "development" && (
          <button
            className="ap-button"
            onClick={async () => {
              await employeeAuthService.prepareRiotFixture();
              setId("emp-riot-poc");
            }}
          >
            Chuẩn bị nhân viên Riot PoC (Development)
          </button>
        )}
      </Panel>
    </div>
  );
}
export function EmployeeDashboard() {
  const s = useWorkflow();
  const e = s.employees.find((e) => e.id === s.employeeId)!;
  const own = s.orders.filter((o) => o.employeeId === e.id);
  const income = s.transactions
    .filter((t) => t.employeeId === e.id)
    .reduce((sum, t) => sum + t.amount, 0);
  return (
    <>
      <PageHeader
        eyebrow="KHÔNG GIAN NHÂN VIÊN"
        title={`Xin chào, ${e.name}`}
        description="Chọn đơn phù hợp. Giữ lời hứa với mỗi khách hàng."
      >
        <Link className="ap-button primary" href="/employee/orders/available">
          Khám phá đơn có thể nhận ↗
        </Link>
      </PageHeader>
      <Stats
        items={[
          ["Trạng thái", e.online ? "Online / Sẵn sàng" : "Ngoại tuyến"],
          ["Đơn đang thực hiện", workload(e.id)],
          ["Giới hạn nhận đơn", `${workload(e.id)} / ${e.maxActiveOrders}`],
          ["Đơn hoàn thành", e.completedOrders],
          ["Tỷ lệ hoàn thành", `${e.successRate}%`],
          ["Thu nhập hiện tại", money(income)],
          [
            "Khiếu nại liên quan",
            s.complaints.filter((c) => c.employeeId === e.id).length,
          ],
        ]}
      />
      <div className="wf-two">
        <Panel title="Đơn hiện tại">
          {own.filter(isActive).length === 0 && (
            <EmptyState title="Chưa có đơn đang thực hiện" text="Bạn hiện chưa nhận đơn nào. Hãy nhận một đơn để bắt đầu làm việc và mở Riot Client.">
              <Link className="ap-button primary" href="/employee/orders/available">Xem đơn có thể nhận</Link>
            </EmptyState>
          )}
          {own.filter(isActive).map((o) => (
            <Link
              className="wf-row"
              key={o.id}
              href={`/employee/orders/${o.id}`}
            >
              <span>
                <strong>#{o.id}</strong>
                <small>
                  {o.game} · {o.currentRank} → {o.targetRank}
                </small>
              </span>
              <Badge status={o.status} />
              <Progress value={o.progress} />
            </Link>
          ))}
        </Panel>
        <Panel title="Hoạt động gần đây">
          <Timeline employeeId={e.id} />
        </Panel>
      </div>
    </>
  );
}
function Claim({
  order,
  onClose,
}: {
  order: AvailableOrder;
  onClose: () => void;
}) {
  const router = useRouter();
  const notify = useEmployeeNotice();
  const [conflict, setConflict] = useState(false);
  if (conflict)
    return (
      <FormModal
        title="Đơn không còn khả dụng"
        description="Đơn hàng vừa được nhân viên khác nhận."
        submit="Quay lại danh sách"
        onClose={onClose}
        onSubmit={async () => {
          router.push("/employee/orders/available");
        }}
      >
        <p>
          Danh sách đã được cập nhật. Hãy chọn một đơn khác phù hợp với bạn.
        </p>
      </FormModal>
    );
  return (
    <FormModal
      title={`Bạn có chắc muốn nhận đơn #${order.id}?`}
      description="Bạn sẽ chịu trách nhiệm xử lý đơn hàng này sau khi xác nhận."
      submit="Xác nhận nhận đơn"
      onClose={onClose}
      onSubmit={async () => {
        try {
          await orderService.claimOrder(order.id);
          notify("Nhận đơn thành công.");
          router.push(`/employee/orders/${order.id}`);
        } catch (e) {
          if (
            e instanceof WorkflowError &&
            e.code === "ORDER_ALREADY_CLAIMED"
          ) {
            setConflict(true);
            throw new Error(e.message);
          }
          throw e;
        }
      }}
    >
      <Facts
        items={[
          ["Trò chơi", order.game],
          [
            "Dịch vụ",
            order.service === "Coaching" ? "Huấn luyện" : "Nâng hạng",
          ],
          ["Lộ trình", `${order.currentRank} → ${order.targetRank}`],
          ["Khu vực", order.region],
          ["Dự kiến", order.estimatedDuration],
          ["Hoa hồng", money(order.reward)],
        ]}
      />
    </FormModal>
  );
}
export function EmployeeOrders({
  kind,
}: {
  kind: "available" | "active" | "history";
}) {
  const s = useWorkflow();
  const e = s.employees.find((e) => e.id === s.employeeId)!;
  const [query, setQuery] = useState("");
  const [claim, setClaim] = useState<AvailableOrder | null>(null);
  const full = workload(e.id) >= e.maxActiveOrders;
  const orders =
    kind === "available"
      ? orderService.getAvailableOrders()
      : s.orders.filter(
          (o) =>
            o.employeeId === e.id &&
            (kind === "active" ? isActive(o) : !isActive(o)),
        );
  const filtered = orders.filter((o) =>
    `${o.id} ${o.game} ${o.service} ${o.region}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow="ĐƠN HÀNG"
        title={
          kind === "available"
            ? "Đơn có thể nhận"
            : kind === "active"
              ? "Đơn đang thực hiện"
              : "Lịch sử đơn"
        }
        description={
          kind === "available"
            ? "Đơn đã thanh toán và phù hợp năng lực của bạn. Nhận đơn để bắt đầu xử lý."
            : "Theo dõi các đơn thuộc trách nhiệm của bạn."
        }
      >
        <span className="wf-capacity">
          {workload(e.id)} / {e.maxActiveOrders} đơn hoạt động
        </span>
      </PageHeader>
      {full && kind === "available" && (
        <p className="wf-banner">Bạn đã đạt giới hạn đơn đang thực hiện.</p>
      )}
      <label className="ap-search wf-search">
        <span>Tìm đơn</span>
        <input
          aria-label="Tìm đơn nhân viên"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Mã đơn, trò chơi, khu vực…"
        />
      </label>
      <div className="wf-order-grid">
        {filtered.map((o) => (
          <article className="ap-panel wf-order-card" key={o.id}>
            <header>
              <span className="wf-game-icon">
                <Gamepad2 size={22} />
              </span>
              <strong>#{o.id}</strong>
              <Badge status={o.status} />
            </header>
            <h2>{o.game}</h2>
            <p>
              {o.service === "Coaching"
                ? "Huấn luyện"
                : o.service === "Placement Matches"
                  ? "Trận phân hạng"
                  : "Nâng hạng"}
            </p>
            <div className="wf-rank">
              {o.currentRank}
              <ArrowRight size={20} />
              <strong>{o.targetRank}</strong>
            </div>
            <Facts
              items={[
                ["Khu vực", o.region],
                ["Thời gian dự kiến", o.estimatedDuration],
                ["Hoa hồng", money(o.reward)],
                ["Độ khó", o.difficulty],
                [
                  "Điều kiện",
                  o.options.join(" · ") || "Không có yêu cầu đặc biệt",
                ],
                ["Ngày tạo", date(o.createdAt)],
              ]}
            />
            <footer>
              <Link className="ap-button" href={`/employee/orders/${o.id}`}>
                Xem chi tiết
              </Link>
              {kind === "available" && (
                <button
                  className="ap-button primary"
                  disabled={full}
                  title={
                    full
                      ? "Bạn đã đạt giới hạn đơn đang thực hiện."
                      : "Nhận đơn"
                  }
                  onClick={() => setClaim(o)}
                >
                  NHẬN ĐƠN
                </button>
              )}
            </footer>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <EmptyState
          title="Không có đơn phù hợp"
          text="Thử tìm kiếm khác hoặc quay lại sau."
        />
      )}
      {claim && <Claim order={claim} onClose={() => setClaim(null)} />}
    </>
  );
}
export function EmployeeOrderDetail({ id }: { id: string }) {
  const s = useWorkflow();
  const notify = useEmployeeNotice();
  const [action, setAction] = useState<
    "progress" | "issue" | "complete" | "claim" | null
  >(null);
  let projected;
  try {
    projected = orderService.getOrder(id);
  } catch {
    return (
      <EmptyState
        title="Không thể truy cập đơn"
        text="Đơn không còn khả dụng hoặc không thuộc phân công của bạn."
      />
    );
  }
  const own = "customer" in projected ? projected : null;
  const e = s.employees.find((e) => e.id === s.employeeId)!;
  const conversation = own
    ? s.conversations.find((c) => c.orderId === id)
    : undefined;
  const full = workload(e.id) >= e.maxActiveOrders;
  return (
    <>
      <PageHeader
        eyebrow="CHI TIẾT ĐƠN HÀNG"
        title={`#${id}`}
        description={`${projected.game} · ${projected.currentRank} → ${projected.targetRank}`}
      >
        <Badge status={projected.status} />
      </PageHeader>
      <div className="riot-detail-layout">
        <div className="riot-detail-main">
          <Panel title="Thông tin dịch vụ">
            <Facts
              items={[
                ["Dịch vụ", projected.service],
                ["Khu vực", projected.region],
                ["Dự kiến", projected.estimatedDuration],
                ["Hoa hồng", money(projected.reward)],
                ["Điều kiện", projected.options.join(" · ") || "—"],
                ...(own
                  ? ([
                      ["Khách hàng", own.customer.name],
                      ["Bắt đầu", date(own.startedAt)],
                      ["Dự kiến hoàn thành", date(own.deadline)],
                      ["Hướng dẫn", own.instructions],
                    ] as [string, string][])
                  : []),
              ]}
            />
            {own ? (
              <>
                <Progress value={own.progress} />
                <div className="wf-actions">
                  {own.status === "IN_PROGRESS" && (
                    <>
                      <button
                        className="ap-button"
                        onClick={() => setAction("progress")}
                      >
                        Cập nhật tiến độ
                      </button>
                      <button
                        className="ap-button primary"
                        onClick={() => setAction("complete")}
                      >
                        HOÀN THÀNH ĐƠN
                      </button>
                    </>
                  )}

                  {conversation && (
                    <Link
                      className="ap-button"
                      href={`/employee/chat?conversation=${conversation.id}`}
                    >
                      Mở trò chuyện ↗
                    </Link>
                  )}
                </div>
                {own.status === "PENDING_REVIEW" && (
                  <p className="wf-banner">
                    Bạn đã hoàn tất công việc. Đang chờ khách hàng xác nhận.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="wf-banner">
                  Thông tin khách hàng và trò chuyện được mở sau khi nhận đơn.
                </p>
                <button
                  className="ap-button primary"
                  disabled={full}
                  onClick={() => setAction("claim")}
                >
                  NHẬN ĐƠN
                </button>
              </>
            )}
          </Panel>
          {own && (
            <Panel title="Timeline">
              <Timeline orderId={id} />
            </Panel>
          )}
          {!own && (
            <Panel title="Trao đổi với khách hàng">
              <p className="wf-banner">
                Bạn cần nhận đơn trước khi có thể trò chuyện với khách hàng.
              </p>
            </Panel>
          )}
          {conversation && (
            <Panel title="Trao đổi với khách hàng">
              <WorkflowChat
                mode="employee"
                fixedConversation={conversation.id}
              />
            </Panel>
          )}
        </div>
        <aside className="riot-detail-sidebar">
          <RiotClientCard key={id} order={projected} />
          {own && isActive(own) && (
            <Panel title="Cần hỗ trợ?">
              <button
                className="ap-button full"
                onClick={() => setAction("issue")}
              >
                BÁO VẤN ĐỀ
              </button>
            </Panel>
          )}
          <Panel title="Trạng thái đơn">
            <Badge status={projected.status} />
            <Facts
              items={[
                ["Hoa hồng", money(projected.reward)],
                ["Khách hàng", own?.customer.name || "Mở sau khi nhận đơn"],
              ]}
            />
          </Panel>
        </aside>
      </div>
      {action === "claim" && (
        <Claim order={projected} onClose={() => setAction(null)} />
      )}
      {own && action && action !== "claim" && (
        <FormModal
          title={
            action === "complete"
              ? "Xác nhận bạn đã hoàn tất dịch vụ?"
              : action === "issue"
                ? "Báo vấn đề"
                : "Cập nhật tiến độ"
          }
          description={
            action === "complete"
              ? "Đơn sẽ chuyển sang chờ xác nhận, khách hàng sẽ kiểm tra kết quả."
              : "Cập nhật thông tin để đội ngũ theo dõi và hỗ trợ."
          }
          submit={action === "issue" ? "Gửi cho Admin" : "Xác nhận"}
          onClose={() => setAction(null)}
          onSubmit={async (data) => {
            if (action === "complete") await orderService.completeOrder(id);
            else if (action === "issue")
              await orderService.reportIssue(
                id,
                String(data.get("reason")),
                String(data.get("note")),
              );
            else
              await orderService.updateProgress(
                id,
                Number(data.get("progress")),
                String(data.get("note")),
              );
            notify(
              action === "complete"
                ? "Đã gửi kết quả, chờ khách hàng xác nhận."
                : "Đã cập nhật thành công.",
            );
          }}
        >
          {action === "progress" && (
            <Field label="Tiến độ (%)">
              <select name="progress" defaultValue={own.progress}>
                {[...new Set([own.progress, 0, 25, 50, 75, 100])]
                  .sort((a, b) => a - b)
                  .filter((v) => v >= own.progress)
                  .map((v) => (
                    <option key={v} value={v}>
                      {v}%
                    </option>
                  ))}
              </select>
            </Field>
          )}
          {action === "issue" && (
            <Field label="Lý do">
              <select name="reason">
                {[
                  "Không thể tiếp tục đơn",
                  "Vấn đề với tài khoản",
                  "Game / Client lỗi",
                  "Customer không phản hồi",
                  "Sai thông tin đơn",
                  "Khác",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
          )}
          {action !== "complete" && (
            <Field
              label={action === "issue" ? "Mô tả vấn đề" : "Ghi chú tiến độ"}
            >
              <textarea
                name="note"
                required={action === "issue"}
                minLength={action === "issue" ? 10 : undefined}
                maxLength={2000}
                rows={4}
              />
            </Field>
          )}
        </FormModal>
      )}
    </>
  );
}
export function EmployeeAccount({ security = false }: { security?: boolean }) {
  const s = useWorkflow();
  const e = s.employees.find((e) => e.id === s.employeeId)!;
  const notify = useEmployeeNotice();
  return (
    <>
      <PageHeader
        eyebrow="TÀI KHOẢN"
        title={security ? "Bảo mật" : "Hồ sơ nhân viên"}
        description="Thông tin và hoạt động của tài khoản bạn."
      />
      <Panel title={security ? "Phiên làm việc" : e.name}>
        {security ? (
          s.sessions
            .filter((x) => x.employeeId === e.id)
            .map((x) => (
              <div className="wf-row" key={x.id}>
                <span>
                  <strong>{x.device}</strong>
                  <small>
                    {x.ip} · {date(x.lastActivityAt)}
                  </small>
                </span>
                <Badge status={x.status} />
              </div>
            ))
        ) : (
          <>
            <Facts
              items={[
                ["Tên hiển thị", e.name],
                ["Chuyên môn", e.type === "COACH" ? "Huấn luyện" : "Nâng hạng"],
                ["Trò chơi", e.games.join(" · ")],
                ["Riot ID", e.riotId],
                ["Giới hạn", `${e.maxActiveOrders} đơn`],
              ]}
            />
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                await employeeService.updateProfile(
                  String(data.get("phone")),
                  String(data.get("timezone")),
                );
                notify("Đã cập nhật hồ sơ.");
              }}
            >
              <Field label="Số điện thoại">
                <input name="phone" defaultValue={e.phone} maxLength={30} />
              </Field>
              <Field label="Múi giờ">
                <select name="timezone" defaultValue={e.timezone}>
                  <option>Asia/Ho_Chi_Minh</option>
                  <option>Asia/Bangkok</option>
                </select>
              </Field>
              <button className="ap-button primary">Lưu hồ sơ</button>
            </form>
          </>
        )}
      </Panel>
    </>
  );
}
