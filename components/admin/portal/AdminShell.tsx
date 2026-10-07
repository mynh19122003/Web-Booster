"use client";

import { adminText } from "@/lib/admin/vi";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  LayoutDashboard,
  Users,
  Mail,
  ShieldCheck,
  UserRound,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Menu,
  LogOut,
  ArrowUpRight,
  X,
  Zap,
  Package,
  Inbox,
  GitBranch,
  MessageSquare,
} from "lucide-react";
import { useAdminStore } from "@/lib/admin/store";
import { adminNav } from "@/lib/admin/config";
import { adminAuthService } from "@/services/admin";
import { AscendLogo } from "@/components/ui/AscendLogo";
import { Avatar } from "./Ui";
import { useOperations } from "@/lib/admin/operations-store";
import { useOperationsHydration } from "@/lib/admin/use-operations";
import { incomingStatuses } from "@/services/operations";
import { can } from "@/services/admin";
const Notice = createContext<(text: string) => void>(() => {});
export const useNotice = () => useContext(Notice);
const icons = {
  overview: LayoutDashboard,
  staff: Users,
  invitations: Mail,
  security: ShieldCheck,
  profile: UserRound,
  orders: Package,
  incoming: Inbox,
  assignments: GitBranch,
  chat: MessageSquare,
};
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useAdminStore();
  const operationsReady = useOperationsHydration();
  const {
    orders,
    conversations,
    notifications: operationNotifications,
  } = useOperations();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [notice, setNotice] = useState("");
  const [notifications, setNotifications] = useState(false);
  const publicPage =
    pathname === "/admin/login" || pathname === "/admin/accept-invitation";
  useEffect(() => {
    void useAdminStore.persist.rehydrate();
  }, []);
  useEffect(() => {
    if (ready && !user && !publicPage) router.replace("/admin/login");
  }, [ready, user, publicPage, router]);
  useEffect(() => {
    if (notice) {
      const timeout = setTimeout(() => setNotice(""), 6000);
      return () => clearTimeout(timeout);
    }
  }, [notice]);
  const active = [...adminNav]
    .reverse()
    .find(
      (n) =>
        n.href === pathname ||
        (n.href !== "/admin" && pathname.startsWith(n.href + "/")),
    );
  if (!ready || !operationsReady)
    return (
      <div className="ap-loading" aria-label="Đang tải trang quản trị">
        <div className="ap-skeleton" />
        <div className="ap-skeleton" />
        <p>Đang chuẩn bị không gian làm việc…</p>
      </div>
    );
  if (publicPage)
    return <Notice.Provider value={setNotice}>{children}</Notice.Provider>;
  if (!user) return <div className="ap-loading">Đang mở trang đăng nhập…</div>;
  const nav = adminNav.filter(
    (n) =>
      (!n.owner || user.role === "SUPER_ADMIN") &&
      (!n.permission ||
        user.role === "SUPER_ADMIN" ||
        user.permissions.includes(n.permission)),
  );
  return (
    <Notice.Provider value={setNotice}>
      <div
        className={`ap-workspace ${collapsed ? "is-collapsed" : ""} ${mobile ? "is-mobile-open" : ""}`}
      >
        {mobile && (
          <button
            className="ap-sidebar-backdrop"
            aria-label="Đóng điều hướng"
            onClick={() => setMobile(false)}
          />
        )}
        <aside className="ap-sidebar">
          <Link href="/admin" className="ap-brand">
            <AscendLogo variant={collapsed ? "icon" : "horizontal"} size="md" />
          </Link>
          <div className="ap-workspace-label">
            <AscendLogo variant="icon" size="sm" />
            <div>
              Không gian ASCEND<small>Vận hành và nhân sự</small>
            </div>
            <ChevronRight size={14} />
          </div>
          <nav aria-label="Điều hướng quản trị">
            {nav.map((n, index) => {
              const Icon = icons[n.icon as keyof typeof icons];
              const count =
                n.icon === "incoming"
                  ? orders.filter((o) => incomingStatuses.includes(o.status))
                      .length
                  : n.icon === "chat"
                    ? conversations
                        .filter((c) => !c.archived)
                        .reduce((sum, c) => sum + c.unread, 0) : 0;
              return (
                <div key={n.href}>
                  {n.group && n.group !== nav[index - 1]?.group && (
                    <div className="ap-nav-label">{n.group}</div>
                  )}
                  <Link
                    key={n.href}
                    href={n.href}
                    title={n.label}
                    onClick={() => setMobile(false)}
                    className={active?.href === n.href ? "active" : ""}
                  >
                    <Icon size={18} />
                    <span>{n.label}</span>
                    {count > 0 && <b>{count}</b>}
                  </Link>
                </div>
              );
            })}
          </nav>
          <div className="ap-sidebar-bottom">
            <div className="ap-demo-card">
              <Zap size={18} />
              <strong>Nâng tầm vận hành.</strong>
              <p>
                Không gian làm việc dành cho đội ngũ tạo nên trải nghiệm chơi
                game tuyệt vời.
              </p>
              <span>
                <i /> Không gian dùng thử{" "}
              </span>
            </div>
            <Link href="/" className="ap-public-link">
              Xem trang web <ArrowUpRight size={15} />
            </Link>
            <button
              className="ap-collapse"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
            >
              {collapsed ? (
                <ChevronRight size={17} />
              ) : (
                <>
                  <ChevronLeft size={17} />
                  <span>Thu gọn thanh bên</span>
                </>
              )}
            </button>
          </div>
        </aside>
        <div className="ap-main">
          <header className="ap-topbar">
            <button
              className="ap-mobile-toggle"
              aria-label="Mở điều hướng"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={22} />
            </button>
            <div className="ap-breadcrumb">
              Không gian làm việc <ChevronRight size={13} />
              <strong>{active?.label ?? "Chi tiết hồ sơ"}</strong>
            </div>
            <div className="ap-topbar-right">
              <Link
                href={can("order.view") ? "/admin/orders" : "/admin/profile"}
                className="ap-top-search"
              >
                <Search size={16} />
                <span>{can("order.view") ? "Tìm đơn hàng" : "Tìm hồ sơ"}</span>
                <kbd>↗</kbd>
              </Link>
              <span className="ap-demo-tag">DÙNG THỬ</span>
              <div className="ap-notifications">
                <button
                  aria-label="Thông báo"
                  onClick={() => setNotifications(!notifications)}
                >
                  <Bell size={19} />
                  <i />
                </button>
                {notifications && (
                  <div className="ap-notification-popover">
                    <strong>Thông báo quản trị</strong>
                    {operationNotifications
                      .filter((n) => can(n.scope))
                      .slice(0, 5)
                      .map((n) => (
                        <Link
                          className="op-notification-item"
                          href={n.href}
                          key={n.id}
                          onClick={() => setNotifications(false)}
                        >
                          <strong>{adminText(n.title)}</strong>
                          <span>{adminText(n.detail)}</span>
                          <small>
                            {new Date(n.at).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            · dùng thử{" "}
                          </small>
                        </Link>
                      ))}
                  </div>
                )}
              </div>
              <details className="ap-account-menu">
                <summary>
                  <Avatar name={user.fullName} />
                  <span>
                    {user.displayName}
                    <small>
                      {user.role === "SUPER_ADMIN"
                        ? "Quản trị viên cấp cao"
                        : "Nhân sự quản trị"}
                    </small>
                  </span>
                </summary>
                <div>
                  <Link href="/admin/profile">Hồ sơ cá nhân</Link>
                  <button
                    onClick={() => {
                      void adminAuthService.logout();
                      router.push("/admin/login");
                    }}
                  >
                    <LogOut size={15} /> Đăng xuất{" "}
                  </button>
                </div>
              </details>
            </div>
          </header>
          <div className="ap-content" key={pathname}>
            {children}
          </div>
          <footer className="ap-workspace-footer">
            <span>
              ASCEND <i>/</i> Vận hành đội ngũ{" "}
            </span>
            <span>
              <i className="ap-online" /> Dùng thử cục bộ · Không gửi email hay
              thay đổi tài khoản thật{" "}
            </span>
          </footer>
        </div>
        {notice && (
          <div className="ap-toast" role="status">
            <ShieldCheck size={19} />
            <span>{notice}</span>
            <button aria-label="Đóng thông báo" onClick={() => setNotice("")}>
              <X size={17} />
            </button>
          </div>
        )}
      </div>
    </Notice.Provider>
  );
}
