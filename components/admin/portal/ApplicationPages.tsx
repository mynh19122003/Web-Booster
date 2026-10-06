"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  X,
  Send,
  Trophy,
  ClipboardCheck,
  Globe,
  Mail,
} from "lucide-react";
import { useAdminStore } from "@/lib/admin/store";
import { can, employeeApplicationService } from "@/services/admin";
import type { ApproveApplicationInput } from "@/types/admin";
import { useNotice } from "./AdminShell";
import {
  AccessDenied,
  PageHeader,
  SearchFilterBar,
  DataTable,
  Avatar,
  StatusBadge,
  FormModal,
  Field,
  EmptyState,
  formatDate,
} from "./Ui";
export function ApplicationsPage() {
  const { applications } = useAdminStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  if (!can("employee.application.view")) return <AccessDenied />;
  const rows = applications.filter(
    (a) =>
      `${a.fullName} ${a.email} ${a.riotId}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "ALL" || status === a.status),
  );
  return (
    <>
      <PageHeader
        eyebrow="FIND YOUR NEXT MVP"
        title="Employee applications"
        description="Meet the talent ready to take ASCEND to the next level."
      >
        <span className="ap-date">
          <ClipboardCheck size={17} />{" "}
          {applications.filter((a) => a.status === "PENDING").length} awaiting
          review
        </span>
      </PageHeader>
      <div className="ap-tabs" role="group" aria-label="Application status">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button
            key={s}
            className={status === s ? "active" : ""}
            onClick={() => setStatus(s)}
          >
            {s === "ALL" ? "All applications" : s[0] + s.slice(1).toLowerCase()}
            <span>
              {applications.filter((a) => s === "ALL" || a.status === s).length}
            </span>
          </button>
        ))}
      </div>
      <section className="ap-panel">
        <SearchFilterBar
          query={query}
          onQuery={setQuery}
          status={status}
          onStatus={setStatus}
          statuses={["PENDING", "APPROVED", "REJECTED"]}
          placeholder="Search name, email or Riot ID…"
        />
        <DataTable
          label="Applications"
          rows={rows}
          columns={[
            {
              label: "Applicant",
              render: (a) => (
                <div className="ap-person">
                  <Avatar name={a.fullName} />
                  <div>
                    <strong>{a.fullName}</strong>
                    <small>{a.email}</small>
                  </div>
                </div>
              ),
            },
            {
              label: "Position",
              render: (a) => (
                <span className="ap-position">
                  {a.positionApplied.toLowerCase()}
                </span>
              ),
            },
            {
              label: "Riot ID / Rank",
              render: (a) => (
                <div className="ap-cell-stack">
                  {a.riotId}
                  <small className="ap-rank">{a.currentRank}</small>
                </div>
              ),
            },
            {
              label: "Status",
              render: (a) => <StatusBadge status={a.status} />,
            },
            { label: "Submitted", render: (a) => formatDate(a.submittedAt) },
            {
              label: "Review",
              render: (a) => (
                <Link
                  className="ap-icon-button"
                  aria-label={`Review ${a.fullName}`}
                  href={`/admin/employee-applications/${a.id}`}
                >
                  <ArrowUpRight size={18} />
                </Link>
              ),
            },
          ]}
        />
      </section>
    </>
  );
}
export function ApplicationDetail({ id }: { id: string }) {
  const { applications } = useAdminStore();
  const a = applications.find((x) => x.id === id);
  const notice = useNotice();
  const [dialog, setDialog] = useState<"approve" | "reject" | "resend" | null>(
    null,
  );
  if (!can("employee.application.view")) return <AccessDenied />;
  if (!a)
    return (
      <EmptyState
        title="Application not found"
        text="This application may no longer be available."
      >
        <Link className="ap-button" href="/admin/employee-applications">
          Back to applications
        </Link>
      </EmptyState>
    );
  return (
    <>
      <Link className="ap-back" href="/admin/employee-applications">
        <ArrowLeft size={15} /> All applications
      </Link>
      <PageHeader
        eyebrow={`APPLICATION / ${a.id.toUpperCase()}`}
        title={a.fullName}
        description={`Submitted ${formatDate(a.submittedAt)} · ${a.positionApplied.toLowerCase()} position`}
      >
        <StatusBadge status={a.status} />
        {a.status === "PENDING" && (
          <>
            {can("employee.application.reject") && (
              <button className="ap-button" onClick={() => setDialog("reject")}>
                <X size={16} /> Reject
              </button>
            )}
            {can("employee.application.approve") && (
              <button
                className="ap-button primary"
                onClick={() => setDialog("approve")}
              >
                <Check size={16} /> Approve application
              </button>
            )}
          </>
        )}
      </PageHeader>
      <div className="ap-detail-grid">
        <div>
          <section className="ap-panel">
            <div className="ap-profile-banner">
              <Avatar name={a.fullName} size="large" />
              <div>
                <h2>{a.displayName}</h2>
                <p>{a.fullName}</p>
              </div>
              <span className="ap-rank-pill">
                <Trophy size={16} />
                {a.currentRank}
              </span>
            </div>
            <div className="ap-detail-facts ap-panel-padding">
              <div>
                <span>Email address</span>
                <a href={`mailto:${a.email}`}>{a.email}</a>
              </div>
              <div>
                <span>Phone</span>
                {a.phone}
              </div>
              <div>
                <span>Country</span>
                {a.country === "VN" ? "Vietnam" : a.country}
              </div>
              <div>
                <span>Timezone</span>
                {a.timezone}
              </div>
              <div>
                <span>Riot ID</span>
                {a.riotId}
              </div>
              <div>
                <span>Position applied</span>
                {a.positionApplied}
              </div>
            </div>
          </section>
          <section className="ap-panel ap-prose">
            <h2>Experience & background</h2>
            <p>{a.experience}</p>
            <h2>A note from {a.displayName}</h2>
            <p>{a.note}</p>
          </section>
        </div>
        <aside>
          <section className="ap-panel ap-prose">
            <div className="ap-section-icon">
              <ClipboardCheck size={22} />
            </div>
            <h2>Review status</h2>
            <StatusBadge status={a.status} />
            <ol className="ap-review-timeline">
              <li>
                <b>Application received</b>
                <small>{formatDate(a.submittedAt)}</small>
              </li>
              <li>
                <b>
                  {a.status === "PENDING"
                    ? "Awaiting your review"
                    : `Application ${a.status.toLowerCase()}`}
                </b>
                <small>
                  {a.reviewedBy
                    ? `${a.reviewedBy} · ${formatDate(a.reviewedAt!)}`
                    : "Take a moment to review their experience."}
                </small>
              </li>
            </ol>
            {a.rejectionReason && (
              <div className="ap-error">{a.rejectionReason}</div>
            )}
            {a.status === "APPROVED" && (
              <>
                <div className="ap-success">
                  <Mail size={18} />
                  <span>
                    Employee credentials have been sent.
                    <small>Simulated delivery in this demo.</small>
                  </span>
                </div>
                <p>First sign-in requires a password change within 24 hours.</p>
                <p>
                  {a.department} · {a.maxActiveOrders} active orders
                </p>
                {can("employee.application.approve") && (
                  <button
                    className="ap-button"
                    onClick={() => setDialog("resend")}
                  >
                    <Send size={15} /> Resend credentials
                  </button>
                )}
              </>
            )}
          </section>
          <div className="ap-side-note">
            <Globe size={18} />
            <p>
              Great service starts with great people. Review every application
              thoughtfully.
            </p>
          </div>
        </aside>
      </div>
      {dialog && (
        <FormModal
          title={
            dialog === "approve"
              ? "Welcome a new employee"
              : dialog === "reject"
                ? "Reject application"
                : "Resend employee credentials"
          }
          description={
            dialog === "approve"
              ? `Set up ${a.displayName}’s employee account. Temporary credentials will be sent by email.`
              : dialog === "reject"
                ? "Add a clear reason for your decision. This review cannot be undone."
                : "A new temporary password replaces the old one and revokes existing sessions."
          }
          submit={
            dialog === "approve"
              ? "Approve & send credentials"
              : dialog === "reject"
                ? "Reject application"
                : "Resend credentials"
          }
          danger={dialog === "reject"}
          onClose={() => setDialog(null)}
          onSubmit={async (data) => {
            if (dialog === "approve")
              await employeeApplicationService.approveEmployeeApplication(
                a.id,
                {
                  employeeType: String(
                    data.get("employee_type"),
                  ) as ApproveApplicationInput["employeeType"],
                  department: String(
                    data.get("department"),
                  ) as ApproveApplicationInput["department"],
                  maxActiveOrders: Number(data.get("max_active_orders")),
                },
              );
            if (dialog === "reject")
              await employeeApplicationService.rejectEmployeeApplication(
                a.id,
                String(data.get("rejection_reason")),
              );
            if (dialog === "resend")
              await employeeApplicationService.resendCredentials(a.id);
            notice(
              dialog === "reject"
                ? "Application rejected. Review saved."
                : "Employee credentials have been sent (demo).",
            );
          }}
        >
          {dialog === "approve" ? (
            <>
              <Field label="Employee type">
                <select name="employee_type" defaultValue={a.positionApplied}>
                  <option>BOOSTER</option>
                  <option>COACH</option>
                </select>
              </Field>
              <Field label="Department">
                <select
                  name="department"
                  defaultValue={
                    a.positionApplied === "COACH" ? "COACHING" : "BOOSTING"
                  }
                >
                  <option>BOOSTING</option>
                  <option>COACHING</option>
                </select>
              </Field>
              <Field label="Maximum active orders">
                <input
                  name="max_active_orders"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={3}
                  required
                />
              </Field>
            </>
          ) : dialog === "reject" ? (
            <Field label="Rejection reason">
              <textarea
                name="rejection_reason"
                required
                minLength={5}
                maxLength={2000}
                rows={4}
                placeholder="Explain why this application is not a fit…"
              />
            </Field>
          ) : (
            <p>
              This demo records the resend in the audit timeline. No real email
              is sent.
            </p>
          )}
        </FormModal>
      )}
    </>
  );
}
