import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { currentUser } from "@/lib/current-user";
import { canManageCoach, coachBase, coachPublished } from "@/lib/coach-ownership";
import { CoachRiotAccounts } from "@/components/coaches/CoachRiotAccounts";
import { UiText } from "@/components/ui/UiText";

export const metadata = { title: "Edit coach profile", robots: { index: false, follow: false } };

export default async function EditCoachPage({ params }: PageProps<"/employee/coaches/[slug]/edit">) {
  const user = await currentUser();
  if (!user) redirect("/employee/login");
  if (user.role !== "employee") redirect("/");
  const { slug } = await params;
  if (!canManageCoach(user, slug)) notFound();
  const coach = coachBase(slug);
  if (!coach) notFound();
  const published = coachPublished(slug);
  return <div className="employee-workspace">
    <div className="employee-dashboard-header"><div className="employee-dashboard-brand">
      <Link href={published ? `/coaches/${slug}` : "/employee/coaches"} className="employee-back-link"><ArrowLeft size={15} /><UiText english={published ? "Back to coach profile" : "Back to coach workspace"} vietnamese={published ? "Về hồ sơ coach" : "Về không gian coach"} /></Link>
      <h1><Pencil size={26} aria-hidden="true" /><span><UiText english="Edit profile" vietnamese="Chỉnh sửa hồ sơ" /> · {coach.name}</span></h1>
      <p className="employee-dashboard-desc"><UiText english="Update profile information, coaching availability and your Riot account." vietnamese="Cập nhật thông tin hồ sơ, trạng thái nhận coaching và tài khoản Riot." /></p>
    </div></div>
    <CoachRiotAccounts selectedSlug={slug} editMode />
  </div>;
}
