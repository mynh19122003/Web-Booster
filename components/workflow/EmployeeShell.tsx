"use client";
import {
  useState,
  useEffect,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Package,
  MessageSquare,
  ShieldCheck,
  UserRound,
  Bell,
} from "lucide-react";
import { AscendLogo } from "@/components/ui/AscendLogo";
import { useWorkflow } from "@/lib/workflow/store";
import {
  useWorkflowReady,
  employeeAuthService,
  employeeActiveOrders as workload,
} from "@/services/workflow-adapter";
const Notice = createContext<(value: string) => void>(() => {});
export const useEmployeeNotice = () => useContext(Notice);
const nav = [
  ["/employee", "Tổng quan", "", LayoutDashboard],
  ["/employee/orders/available", "Đơn có thể nhận", "ĐƠN HÀNG", Package],
  ["/employee/orders/active", "Đơn đang thực hiện", "ĐƠN HÀNG", Package],
  ["/employee/orders/history", "Lịch sử đơn", "ĐƠN HÀNG", Package],
  ["/employee/chat", "Tin nhắn", "LIÊN LẠC", MessageSquare],
  ["/employee/profile", "Hồ sơ", "TÀI KHOẢN", UserRound],
  ["/employee/security", "Bảo mật", "TÀI KHOẢN", ShieldCheck],
] as const;
export function EmployeeShell({ children }: { children: ReactNode }) {
  const ready = useWorkflowReady();
  const s = useWorkflow();
  const path = usePathname();
  const router = useRouter();
  const [mobile, setMobile] = useState(false);
  const [notice, setNotice] = useState("");
  const [notifications, setNotifications] = useState(false);
  const e = s.employees.find((e) => e.id === s.employeeId);
  const valid =
    e?.status === "ACTIVE" &&
    s.sessions.some(
      (x) => x.id === s.employeeSessionId && x.status === "ACTIVE",
    );
  useEffect(() => {
    if (ready && !valid && path !== "/employee/login")
      router.replace("/employee/login");
  }, [ready, valid, path, router]);
  useEffect(() => {
    if (notice) {
      const id = setTimeout(() => setNotice(""), 6000);
      return () => clearTimeout(id);
    }
  }, [notice]);
  if (!ready)
    return <div className="ap-loading">Đang chuẩn bị không gian làm việc…</div>;
  if (path === "/employee/login")
    return <Notice.Provider value={setNotice}>{children}</Notice.Provider>;
  if (!valid || !e)
    return <div className="ap-loading">Đang mở trang đăng nhập…</div>;
  return (
    <Notice.Provider value={setNotice}>
      <div
        className={`ap-workspace wf-employee ${mobile ? "is-mobile-open" : ""}`}
      >
        {mobile && (
          <button
            className="ap-sidebar-backdrop"
            aria-label="Đóng điều hướng"
            onClick={() => setMobile(false)}
          />
        )}
        <aside className="ap-sidebar">
          <Link className="ap-brand" href="/employee">
            <AscendLogo size="md" />
          </Link>
          <div className="ap-workspace-label">
            Không gian nhân viên <small>Tiến độ · Chất lượng · Tin cậy</small>
          </div>
          <nav aria-label="Điều hướng nhân viên">
            {nav.map(([href, label, group, Icon], i) => (
              <div key={href}>
                {group && nav[i - 1]?.[2] !== group && (
                  <div className="ap-nav-label">{group}</div>
                )}
                <Link
                  className={path === href ? "active" : ""}
                  href={href}
                  onClick={() => setMobile(false)}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              </div>
            ))}
          </nav>
          <div className="ap-sidebar-bottom">
            <div className="ap-demo-card">
              <strong>Mỗi đơn là một cam kết.</strong>
              <p>
                Nhận đơn phù hợp, cập nhật tiến độ và giữ liên lạc với khách
                hàng.
              </p>
            </div>
            <Link className="ap-public-link" href="/">
              Xem trang web ↗
            </Link>
          </div>
        </aside>
        <div className="ap-main">
          <header className="ap-topbar">
            <button
              className="ap-mobile-toggle"
              aria-label="Mở điều hướng"
              onClick={() => setMobile(!mobile)}
            >
              <Menu />
            </button>
            <div className="ap-breadcrumb">
              Nhân viên /{" "}
              <strong>
                {nav.find(([href]) => href === path)?.[1] || "Chi tiết đơn"}
              </strong>
            </div>
            <div className="ap-topbar-right">
              <span className="wf-capacity">
                {workload(e.id)} / {e.maxActiveOrders} đơn
              </span>
              <div className="ap-notifications">
                <button
                  aria-label="Thông báo nhân viên"
                  onClick={() => setNotifications(!notifications)}
                >
                  <Bell size={19} />
                </button>
                {notifications && (
                  <div className="ap-notification-popover">
                    <strong>Hoạt động của bạn</strong>
                    {s.activities
                      .filter((a) => a.employeeId === e.id)
                      .slice(-5)
                      .reverse()
                      .map((a) => (
                        <p key={a.id}>{a.title}</p>
                      ))}
                  </div>
                )}
              </div>
              <span>{e.name}</span>
              <button
                className="ap-icon-button"
                aria-label="Đăng xuất"
                onClick={() => {
                  employeeAuthService.logout();
                  router.push("/employee/login");
                }}
              >
                <LogOut size={18} />
              </button>
            </div>
          </header>
          <div className="ap-content" key={path}>
            {children}
          </div>
          <footer className="ap-workspace-footer">
            ASCEND · Không gian nhân viên
          </footer>
        </div>
        {notice && (
          <div className="ap-toast" role="status">
            <ShieldCheck size={18} />
            <span>{notice}</span>
            <button aria-label="Đóng thông báo" onClick={() => setNotice("")}>
              <X size={18} />
            </button>
          </div>
        )}
      </div>
    </Notice.Provider>
  );
}
