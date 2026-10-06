"use client";
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
  ClipboardList,
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
  applications: ClipboardList,
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
  const { user, ready, applications } = useAdminStore();
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
      <div className="ap-loading" aria-label="Loading admin workspace">
        <div className="ap-skeleton" />
        <div className="ap-skeleton" />
        <p>Preparing your workspace…</p>
      </div>
    );
  if (publicPage)
    return <Notice.Provider value={setNotice}>{children}</Notice.Provider>;
  if (!user) return <div className="ap-loading">Opening sign in…</div>;
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
            aria-label="Close navigation"
            onClick={() => setMobile(false)}
          />
        )}
        <aside className="ap-sidebar">
          <Link href="/admin" className="ap-brand">
            <span className="ap-mark">A</span>
            <span>
              ASCEND<small>ADMIN PORTAL</small>
            </span>
          </Link>
          <div className="ap-workspace-label">
            <span className="ap-workspace-square">A</span>
            <div>
              Ascend workspace<small>Operations & people</small>
            </div>
            <ChevronRight size={14} />
          </div>
          <nav aria-label="Admin navigation">
            {nav.map((n, index) => {
              const Icon = icons[n.icon as keyof typeof icons];
              const count =
                n.icon === "incoming"
                  ? orders.filter((o) => incomingStatuses.includes(o.status))
                      .length
                  : n.icon === "chat"
                    ? conversations
                        .filter((c) => !c.archived)
                        .reduce((sum, c) => sum + c.unread, 0)
                    : n.icon === "applications"
                      ? applications.filter((a) => a.status === "PENDING")
                          .length
                      : 0;
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
              <strong>Your operations, elevated.</strong>
              <p>A focused workspace for the people behind every great game.</p>
              <span>
                <i /> Demo workspace
              </span>
            </div>
            <Link href="/" className="ap-public-link">
              View public website <ArrowUpRight size={15} />
            </Link>
            <button
              className="ap-collapse"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight size={17} />
              ) : (
                <>
                  <ChevronLeft size={17} />
                  <span>Collapse sidebar</span>
                </>
              )}
            </button>
          </div>
        </aside>
        <div className="ap-main">
          <header className="ap-topbar">
            <button
              className="ap-mobile-toggle"
              aria-label="Open navigation"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={22} />
            </button>
            <div className="ap-breadcrumb">
              Workspace <ChevronRight size={13} />
              <strong>{active?.label ?? "Application detail"}</strong>
            </div>
            <div className="ap-topbar-right">
              <Link
                href={
                  can("order.view")
                    ? "/admin/orders"
                    : "/admin/employee-applications"
                }
                className="ap-top-search"
              >
                <Search size={16} />
                <span>
                  {can("order.view") ? "Find an order" : "Find an application"}
                </span>
                <kbd>↗</kbd>
              </Link>
              <span className="ap-demo-tag">DEMO</span>
              <div className="ap-notifications">
                <button
                  aria-label="Notifications"
                  onClick={() => setNotifications(!notifications)}
                >
                  <Bell size={19} />
                  <i />
                </button>
                {notifications && (
                  <div className="ap-notification-popover">
                    <strong>Workspace notifications</strong>
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
                          <strong>{n.title}</strong>
                          <span>{n.detail}</span>
                          <small>
                            {new Date(n.at).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            · demo
                          </small>
                        </Link>
                      ))}
                    <p>
                      {
                        applications.filter((a) => a.status === "PENDING")
                          .length
                      }{" "}
                      applications are waiting for review.
                    </p>
                    <Link
                      href="/admin/employee-applications"
                      onClick={() => setNotifications(false)}
                    >
                      Open applications →
                    </Link>
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
                        ? "Super admin"
                        : "Staff member"}
                    </small>
                  </span>
                </summary>
                <div>
                  <Link href="/admin/profile">My profile</Link>
                  <button
                    onClick={() => {
                      void adminAuthService.logout();
                      router.push("/admin/login");
                    }}
                  >
                    <LogOut size={15} /> Sign out
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
              ASCEND <i>/</i> Team operations
            </span>
            <span>
              <i className="ap-online" /> Local demo · No live emails or account
              changes
            </span>
          </footer>
        </div>
        {notice && (
          <div className="ap-toast" role="status">
            <ShieldCheck size={19} />
            <span>{notice}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() => setNotice("")}
            >
              <X size={17} />
            </button>
          </div>
        )}
      </div>
    </Notice.Provider>
  );
}
