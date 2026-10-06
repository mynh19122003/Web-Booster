"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Monitor, LockKeyhole, LogOut } from "lucide-react";
import { useAdminStore } from "@/lib/admin/store";
import { securityService, adminAuthService } from "@/services/admin";
import type { SecuritySession } from "@/types/admin";
import { useNotice } from "./AdminShell";
import {
  PageHeader,
  DataTable,
  Avatar,
  StatusBadge,
  ActivityTimeline,
  FormModal,
  Field,
  PermissionBadgeGroup,
  formatDate,
} from "./Ui";
export function SecurityPage() {
  const { sessions, activities, user } = useAdminStore();
  const notice = useNotice();
  const [target, setTarget] = useState<SecuritySession | null>(null);
  const owner = user?.role === "SUPER_ADMIN";
  const visible = sessions.filter((s) => owner || s.userId === user?.id);
  return (
    <>
      <PageHeader
        eyebrow="PROTECT YOUR WORKSPACE"
        title="Security & activity"
        description="Know who’s signed in. Stay in control of your team’s access."
      >
        <span className="ap-date">
          <ShieldCheck size={16} /> Session monitoring
        </span>
      </PageHeader>
      <div className="ap-info-strip">
        <ShieldCheck size={20} />
        <p>
          Revoking a session signs that device out. IP addresses are recorded
          for audit, never used as the only authentication factor.
        </p>
      </div>
      <section className="ap-panel">
        <div className="ap-panel-heading">
          <div>
            <h2>Login sessions</h2>
            <p>
              {owner
                ? "Active and recently revoked sessions across your team."
                : "Your account’s recent sessions."}
            </p>
          </div>
          <span className="ap-count">
            {visible.filter((s) => s.status === "ACTIVE").length} active
          </span>
        </div>
        <DataTable
          rows={visible}
          label="Sessions"
          columns={[
            {
              label: "User",
              render: (s) => (
                <div className="ap-person">
                  <Avatar name={s.user} />
                  <div>
                    <strong>{s.user}</strong>
                    <small>{s.email}</small>
                  </div>
                </div>
              ),
            },
            {
              label: "Device / IP",
              render: (s) => (
                <div className="ap-cell-stack">
                  <span>
                    <Monitor size={14} /> {s.device}
                  </span>
                  <small>{s.ip}</small>
                </div>
              ),
            },
            { label: "Login time", render: (s) => formatDate(s.loginAt) },
            {
              label: "Last activity",
              render: (s) => formatDate(s.lastActivityAt),
            },
            {
              label: "Status",
              render: (s) => <StatusBadge status={s.status} />,
            },
            {
              label: "Actions",
              render: (s) =>
                s.status === "ACTIVE" ? (
                  <button
                    className="ap-button small"
                    onClick={() => setTarget(s)}
                  >
                    Revoke{s.current ? " (current)" : ""}
                  </button>
                ) : (
                  <span className="ap-muted">Signed out</span>
                ),
            },
          ]}
        />
      </section>
      <section className="ap-panel ap-spaced">
        <div className="ap-panel-heading">
          <div>
            <h2>Audit activity</h2>
            <p>A clear record of important workspace changes.</p>
          </div>
          <span className="ap-demo-tag">DEMO EVENTS</span>
        </div>
        <ActivityTimeline
          activities={activities.filter(
            (a) => owner || a.actor === user?.fullName,
          )}
        />
      </section>
      {target && (
        <FormModal
          title="Revoke this session?"
          description={`${target.user} · ${target.device}`}
          submit="Revoke session"
          danger
          onClose={() => setTarget(null)}
          onSubmit={async () => {
            await securityService.revokeSession(target.id);
            notice("Session revoked successfully.");
          }}
        >
          <p>
            {target.current && target.userId === user?.id
              ? "This is your current demo session. You will be signed out."
              : "This device will lose access immediately. The user must sign in again to continue."}
          </p>
        </FormModal>
      )}
    </>
  );
}
export function ProfilePage() {
  const { user, sessions } = useAdminStore();
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  if (!user) return null;
  async function change(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setPending(true);
    setError("");
    try {
      await adminAuthService.changePassword(
        String(data.get("current")),
        String(data.get("password")),
        String(data.get("confirmation")),
      );
      router.push("/admin/login?changed=1");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to change password.");
    } finally {
      setPending(false);
    }
  }
  const recent = sessions.find((s) => s.userId === user.id);
  return (
    <>
      <PageHeader
        eyebrow="YOUR ACCOUNT"
        title="My profile"
        description="Your identity, access and security preferences."
      />
      <div className="ap-detail-grid">
        <div>
          <section className="ap-panel">
            <div className="ap-profile-banner">
              <Avatar name={user.fullName} size="large" />
              <div>
                <h2>{user.fullName}</h2>
                <p>{user.email}</p>
              </div>
              <span className="ap-role">{user.role.replaceAll("_", " ")}</span>
            </div>
            <div className="ap-detail-facts ap-panel-padding">
              <div>
                <span>Display name</span>
                {user.displayName}
              </div>
              <div>
                <span>Account status</span>
                <StatusBadge status="ACTIVE" />
              </div>
              <div>
                <span>Workspace</span>ASCEND Operations
              </div>
              <div>
                <span>Access</span>
                {user.role === "SUPER_ADMIN" ? (
                  "Full workspace access"
                ) : (
                  <PermissionBadgeGroup permissions={user.permissions} />
                )}
              </div>
            </div>
          </section>
          <section className="ap-panel ap-prose">
            <h2>
              <LockKeyhole size={20} /> Change password
            </h2>
            <p>
              Changing your password signs you out of all sessions. You’ll need
              to log in again.
            </p>
            <form onSubmit={change}>
              <Field label="Current password">
                <input
                  name="current"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </Field>
              <div className="ap-form-grid">
                <Field label="New password">
                  <input
                    name="password"
                    type="password"
                    minLength={12}
                    maxLength={128}
                    required
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Confirm new password">
                  <input
                    name="confirmation"
                    type="password"
                    required
                    autoComplete="new-password"
                  />
                </Field>
              </div>
              <p className="ap-form-hint">
                12+ characters, uppercase, lowercase, number and symbol. Demo
                only: don’t enter a real password.
              </p>
              {error && (
                <p role="alert" className="ap-error">
                  {error}
                </p>
              )}
              <button
                className="ap-button primary ap-spaced"
                disabled={pending}
              >
                {pending ? "Updating…" : "Update password & sign out"}
                <LogOut size={16} />
              </button>
            </form>
          </section>
        </div>
        <aside>
          <section className="ap-panel ap-prose">
            <div className="ap-section-icon">
              <ShieldCheck size={25} />
            </div>
            <h2>Security at a glance</h2>
            <p>Your permissions are managed by the workspace owner.</p>
            <div className="ap-detail-facts">
              <div>
                <span>Last sign-in</span>
                {recent ? formatDate(recent.loginAt) : "This demo session"}
              </div>
              <div>
                <span>Device</span>
                {recent?.device ?? "Local browser"}
              </div>
              <div>
                <span>IP address</span>
                {recent?.ip ?? "Not recorded in demo"}
              </div>
            </div>
          </section>
          <div className="ap-side-note">
            <LockKeyhole size={18} />
            <p>
              Demo passwords are never saved. Real password checks and session
              revocation will be handled by the API adapter.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
