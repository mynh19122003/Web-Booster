"use client";
import Link from "next/link";
import { useState } from "react";
import { Plus, Users, ShieldCheck, Mail, ArrowUpRight } from "lucide-react";
import { useAdminStore } from "@/lib/admin/store";
import { staffService } from "@/services/admin";
import type { StaffMember, StaffInvitation, Permission } from "@/types/admin";
import { useNotice } from "./AdminShell";
import {
  AccessDenied,
  PageHeader,
  SearchFilterBar,
  DataTable,
  Avatar,
  StatusBadge,
  PermissionBadgeGroup,
  ActionMenu,
  FormModal,
  PermissionFields,
  Field,
  formatDate,
} from "./Ui";
export function StaffPage() {
  const { staff, user } = useAdminStore();
  const notice = useNotice();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [dialog, setDialog] = useState<{
    member: StaffMember;
    action: string;
  } | null>(null);
  if (user?.role !== "SUPER_ADMIN") return <AccessDenied />;
  const rows = staff.filter(
    (s) =>
      `${s.fullName} ${s.email}`.toLowerCase().includes(query.toLowerCase()) &&
      (status === "ALL" || s.status === status),
  );
  return (
    <>
      <PageHeader
        eyebrow="PEOPLE & ACCESS"
        title="Your team, in sync."
        description="Manage the people who keep ASCEND running at its best."
      >
        <Link
          href="/admin/staff/invitations?invite=1"
          className="ap-button primary"
        >
          <Plus size={16} /> Invite staff
        </Link>
      </PageHeader>
      <div className="ap-inline-summary">
        <span>
          <Users size={17} />
          <b>{staff.length}</b> Team members
        </span>
        <span>
          <i className="ap-online" />
          <b>{staff.filter((s) => s.status === "ACTIVE").length}</b> Active
        </span>
        <span>
          <ShieldCheck size={17} /> Permission-based access
        </span>
      </div>
      <section className="ap-panel">
        <SearchFilterBar
          query={query}
          onQuery={setQuery}
          status={status}
          onStatus={setStatus}
          statuses={["ACTIVE", "SUSPENDED"]}
        />
        <DataTable
          label="Staff members"
          rows={rows}
          columns={[
            {
              label: "Team member",
              render: (s) => (
                <div className="ap-person">
                  <Avatar name={s.fullName} />
                  <div>
                    <strong>{s.fullName}</strong>
                    <small>{s.email}</small>
                  </div>
                </div>
              ),
            },
            {
              label: "Role",
              render: (s) => <span className="ap-role">{s.role}</span>,
            },
            {
              label: "Status",
              render: (s) => <StatusBadge status={s.status} />,
            },
            {
              label: "Permissions",
              render: (s) => (
                <PermissionBadgeGroup permissions={s.permissions} />
              ),
            },
            {
              label: "Last login / IP",
              render: (s) => (
                <div className="ap-cell-stack">
                  {formatDate(s.lastLogin)}
                  <small>{s.ip}</small>
                </div>
              ),
            },
            {
              label: "Actions",
              render: (s) => (
                <ActionMenu>
                  {[
                    "View detail",
                    "Edit permissions",
                    s.status === "ACTIVE" ? "Suspend" : "Activate",
                    "Revoke sessions",
                  ].map((action) => (
                    <button
                      key={action}
                      onClick={() => setDialog({ member: s, action })}
                    >
                      {action}
                    </button>
                  ))}
                </ActionMenu>
              ),
            },
          ]}
        />
      </section>
      {dialog && (
        <FormModal
          title={dialog.action}
          description={`${dialog.member.fullName} · ${dialog.member.email}`}
          submit={dialog.action === "View detail" ? "Done" : dialog.action}
          danger={["Suspend", "Revoke sessions"].includes(dialog.action)}
          onClose={() => setDialog(null)}
          onSubmit={async (data) => {
            const { action, member } = dialog;
            if (action === "Edit permissions")
              await staffService.updateStaffPermissions(
                member.id,
                data.getAll("permissions") as Permission[],
              );
            if (action === "Suspend")
              await staffService.suspendStaff(member.id);
            if (action === "Activate")
              await staffService.activateStaff(member.id);
            if (action === "Revoke sessions")
              await staffService.revokeStaffSessions(member.id);
            if (action !== "View detail")
              notice(`${action} completed for ${member.displayName}.`);
          }}
        >
          {dialog.action === "Edit permissions" ? (
            <PermissionFields defaults={dialog.member.permissions} />
          ) : dialog.action === "View detail" ? (
            <div className="ap-detail-facts">
              <div>
                <span>Account status</span>
                <StatusBadge status={dialog.member.status} />
              </div>
              <div>
                <span>Last login</span>
                {formatDate(dialog.member.lastLogin)}
              </div>
              <div>
                <span>Last IP</span>
                {dialog.member.ip}
              </div>
              <div>
                <span>Permissions</span>
                <PermissionBadgeGroup permissions={dialog.member.permissions} />
              </div>
            </div>
          ) : (
            <p>
              {dialog.action === "Suspend"
                ? "This member will lose workspace access and all active sessions will be revoked. You can reactivate them later."
                : dialog.action === "Activate"
                  ? "Restore this staff member’s access. They will need to sign in again."
                  : "All active sessions for this member will be signed out. They can sign in again with their password."}
            </p>
          )}
        </FormModal>
      )}
    </>
  );
}
export function InvitationsPage({
  openInvite = false,
}: {
  openInvite?: boolean;
}) {
  const { invitations, user } = useAdminStore();
  const notice = useNotice();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [invite, setInvite] = useState(openInvite);
  const [dialog, setDialog] = useState<{
    invitation: StaffInvitation;
    action: string;
  } | null>(null);
  if (user?.role !== "SUPER_ADMIN") return <AccessDenied />;
  const rows = invitations.filter(
    (i) =>
      `${i.email} ${i.fullName}`.toLowerCase().includes(query.toLowerCase()) &&
      (status === "ALL" || status === i.status),
  );
  return (
    <>
      <PageHeader
        eyebrow="GROW YOUR TEAM"
        title="Great people. One invitation away."
        description="Invite trusted people into your workspace, with just the right access."
      >
        <button className="ap-button primary" onClick={() => setInvite(true)}>
          <Plus size={16} /> Invite staff
        </button>
      </PageHeader>
      <div className="ap-info-strip">
        <Mail size={18} />
        <p>
          Staff choose their own password. Each invitation is single-use and
          expires after 24 hours.
        </p>
        <span>Secure by default</span>
      </div>
      <section className="ap-panel">
        <SearchFilterBar
          query={query}
          onQuery={setQuery}
          status={status}
          onStatus={setStatus}
          statuses={["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"]}
        />
        <DataTable
          label="Invitations"
          rows={rows}
          columns={[
            {
              label: "Invited member",
              render: (i) => (
                <div className="ap-person">
                  <Avatar name={i.fullName} />
                  <div>
                    <strong>{i.fullName}</strong>
                    <small>{i.email}</small>
                  </div>
                </div>
              ),
            },
            {
              label: "Permissions",
              render: (i) => (
                <PermissionBadgeGroup permissions={i.permissions} />
              ),
            },
            {
              label: "Status",
              render: (i) => <StatusBadge status={i.status} />,
            },
            {
              label: "Invited / Expires",
              render: (i) => (
                <div className="ap-cell-stack">
                  {formatDate(i.createdAt)}
                  <small>{formatDate(i.expiresAt)}</small>
                </div>
              ),
            },
            {
              label: "Actions",
              render: (i) => (
                <ActionMenu>
                  <button
                    onClick={() =>
                      setDialog({ invitation: i, action: "Invitation detail" })
                    }
                  >
                    View detail
                  </button>
                  {["PENDING", "EXPIRED"].includes(i.status) && (
                    <>
                      <button
                        onClick={() =>
                          setDialog({
                            invitation: i,
                            action: "Resend invitation",
                          })
                        }
                      >
                        Resend invitation
                      </button>
                      <button
                        onClick={() =>
                          setDialog({
                            invitation: i,
                            action: "Revoke invitation",
                          })
                        }
                      >
                        Revoke invitation
                      </button>
                    </>
                  )}
                </ActionMenu>
              ),
            },
          ]}
        />
      </section>
      {invite && (
        <FormModal
          title="Invite someone great"
          description="A new teammate. A higher standard. Choose their access below."
          submit="Send invitation"
          onClose={() => setInvite(false)}
          onSubmit={async (data) => {
            await staffService.createStaffInvitation({
              email: String(data.get("email")),
              fullName: String(data.get("full_name")),
              displayName: String(data.get("display_name")),
              permissions: data.getAll("permissions") as Permission[],
            });
            notice("Staff invitation sent (demo). No live email was sent.");
          }}
        >
          <div className="ap-form-grid">
            <Field label="Full name">
              <input
                name="full_name"
                required
                maxLength={160}
                placeholder="e.g. Taylor Chen"
              />
            </Field>
            <Field label="Display name">
              <input
                name="display_name"
                required
                maxLength={80}
                placeholder="e.g. Taylor"
              />
            </Field>
          </div>
          <Field label="Email address">
            <input
              name="email"
              type="email"
              required
              placeholder="teammate@example.com"
            />
          </Field>
          <PermissionFields />
        </FormModal>
      )}
      {dialog && (
        <FormModal
          title={dialog.action}
          description={dialog.invitation.email}
          submit={
            dialog.action === "Invitation detail" ? "Done" : dialog.action
          }
          danger={dialog.action === "Revoke invitation"}
          onClose={() => setDialog(null)}
          onSubmit={async () => {
            if (dialog.action === "Resend invitation")
              await staffService.resendStaffInvitation(dialog.invitation.id);
            if (dialog.action === "Revoke invitation")
              await staffService.revokeStaffInvitation(dialog.invitation.id);
            if (dialog.action !== "Invitation detail")
              notice(`${dialog.action} completed (demo).`);
          }}
        >
          <StatusBadge status={dialog.invitation.status} />
          <p className="ap-spaced">
            {dialog.action === "Revoke invitation"
              ? "This link will stop working immediately. The invited person will no longer be able to join with it."
              : dialog.action === "Resend invitation"
                ? "A new invitation will replace the previous link and restart the 24-hour expiry."
                : `Invited ${formatDate(dialog.invitation.createdAt)}. Expires ${formatDate(dialog.invitation.expiresAt)}.`}
          </p>
          <PermissionBadgeGroup permissions={dialog.invitation.permissions} />
          {dialog.action === "Invitation detail" &&
            dialog.invitation.token &&
            dialog.invitation.status === "PENDING" && (
              <Link
                className="ap-button ap-spaced"
                href={`/admin/accept-invitation?token=${dialog.invitation.token}`}
              >
                Preview demo invitation <ArrowUpRight size={15} />
              </Link>
            )}
        </FormModal>
      )}
    </>
  );
}
