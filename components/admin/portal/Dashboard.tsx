"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  Users,
  Mail,
  ShieldCheck,
  Plus,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useAdminStore } from "@/lib/admin/store";
import { can, getDashboardStats } from "@/services/admin";
import { OperationsOverview } from "../operations/OperationsOverview";
import {
  PageHeader,
  AdminStatCard,
  Avatar,
  StatusBadge,
  ActivityTimeline,
  formatDate,
} from "./Ui";
export function Dashboard() {
  const { user, applications, invitations, activities } = useAdminStore();
  const stats = getDashboardStats();
  const owner = user?.role === "SUPER_ADMIN";
  const view = can("employee.application.view");
  return (
    <>
      <PageHeader
        eyebrow="YOUR WORKSPACE, AT A GLANCE"
        title={`Good morning, ${user?.displayName}.`}
        description="Here’s what’s happening with your team today."
      >
        <span className="ap-date">
          <CalendarDays size={16} /> 05 October 2026
        </span>
        {owner && (
          <Link
            href="/admin/staff/invitations?invite=1"
            className="ap-button primary"
          >
            <Plus size={16} /> Invite staff
          </Link>
        )}
      </PageHeader>
      <OperationsOverview />
      <div className="ap-stats">
        <AdminStatCard
          label="Pending applications"
          value={view ? stats.pendingApplications : 0}
          note={view ? "Ready for your review" : "View permission required"}
          icon={<ClipboardList size={19} />}
          index="01"
        />
        <AdminStatCard
          label="Active staff"
          value={owner ? stats.activeStaff : 1}
          note={owner ? "Keeping things moving" : "Your staff account"}
          icon={<Users size={19} />}
          index="02"
        />
        <AdminStatCard
          label="Pending invitations"
          value={owner ? stats.pendingInvitations : 0}
          note={owner ? "Waiting to join your team" : "Managed by super admin"}
          icon={<Mail size={19} />}
          index="03"
        />
        <AdminStatCard
          label="Active employees"
          value={view ? stats.activeEmployees : 0}
          note="Approved in this workspace"
          icon={<CheckCircle2 size={19} />}
          index="04"
        />
      </div>
      <div className="ap-dashboard-grid">
        <section className="ap-panel ap-applications-panel">
          <div className="ap-panel-heading">
            <div>
              <h2>
                Recent applications{" "}
                <span className="ap-count">
                  {view ? applications.length : "—"}
                </span>
              </h2>
              <p>Your next great team member could be here.</p>
            </div>
            {view && (
              <Link href="/admin/employee-applications">
                View all <ArrowUpRight size={15} />
              </Link>
            )}
          </div>
          {view ? (
            <div className="ap-table-wrap">
              <table aria-label="Recent applications">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Position</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {applications.slice(0, 5).map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="ap-person">
                          <Avatar name={a.fullName} />
                          <div>
                            <strong>{a.fullName}</strong>
                            <small>{a.riotId}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="ap-position">
                          {a.positionApplied.toLowerCase()}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={a.status} />
                      </td>
                      <td>
                        <Link
                          href={`/admin/employee-applications/${a.id}`}
                          className="ap-icon-button"
                          aria-label={`Review ${a.fullName}`}
                        >
                          <ArrowUpRight size={18} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="ap-panel-padding">
              Application access is managed by your super admin.
            </p>
          )}
        </section>
        <section className="ap-panel ap-spotlight">
          <div className="ap-spotlight-icon">
            <ShieldCheck size={29} />
          </div>
          <div className="ap-eyebrow">BUILT ON TRUST</div>
          <h2>
            A great team starts
            <br />
            with the right people.
          </h2>
          <p>
            Review talent, give your staff the right access, and keep your
            workspace secure.
          </p>
          <Link
            href={view ? "/admin/employee-applications" : "/admin/profile"}
            className="ap-button primary"
          >
            {view ? "Review applications" : "View your profile"}
            <ArrowRight size={16} />
          </Link>
          <div className="ap-spotlight-bottom">
            <span className="ap-stack">
              <Avatar name="Olivia Chen" />
              <Avatar name="Marcus Reed" />
              <Avatar name="Sofia Laurent" />
            </span>
            <small>One team. A higher standard.</small>
          </div>
        </section>
        <section className="ap-panel">
          <div className="ap-panel-heading">
            <div>
              <h2>{owner ? "Staff invitations" : "Your workspace"}</h2>
              <p>
                {owner
                  ? "A warm welcome is on its way."
                  : "Everything you need, one click away."}
              </p>
            </div>
            {owner && (
              <Link href="/admin/staff/invitations">
                Manage <ArrowUpRight size={15} />
              </Link>
            )}
          </div>
          {owner ? (
            <div className="ap-invitation-list">
              {invitations.slice(0, 3).map((i) => (
                <div key={i.id}>
                  <span className="ap-mail-icon">
                    <Mail size={18} />
                  </span>
                  <div>
                    <strong>{i.fullName}</strong>
                    <small>{i.email}</small>
                  </div>
                  <StatusBadge status={i.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="ap-panel-padding">
              <p>
                Your account has {user?.permissions.length} assigned
                permissions.
              </p>
              <Link className="ap-text-link" href="/admin/profile">
                Review your access →
              </Link>
            </div>
          )}
          <div className="ap-panel-footnote">
            <span className="ap-online" /> Invitations expire after 24 hours
          </div>
        </section>
        <section className="ap-panel">
          <div className="ap-panel-heading">
            <div>
              <h2>Recent activity</h2>
              <p>A little visibility. A lot of peace of mind.</p>
            </div>
            <Link href="/admin/security">
              Security <ArrowUpRight size={15} />
            </Link>
          </div>
          <ActivityTimeline
            activities={activities
              .filter((a) => owner || a.actor === user?.fullName)
              .slice(0, 3)}
          />
        </section>
      </div>
      <div className="ap-quick-actions">
        {owner && (
          <Link href="/admin/staff">
            <Users size={18} />
            <span>
              Manage your team<small>People, permissions and access</small>
            </span>
            <ArrowUpRight size={17} />
          </Link>
        )}
        <Link href="/admin/security">
          <ShieldCheck size={18} />
          <span>
            Keep your workspace safe
            <small>Sessions and security activity</small>
          </span>
          <ArrowUpRight size={17} />
        </Link>
        <span className="ap-updated">
          Demo snapshot · {formatDate("2026-10-05")}
        </span>
      </div>
    </>
  );
}
