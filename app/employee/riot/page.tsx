import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { currentUser } from "@/lib/current-user";
import { UiText } from "@/components/ui/UiText";
import { RiotDataExplorer } from "@/components/employee/RiotDataExplorer";

export const metadata = { title: "Riot game data", robots: { index: false, follow: false } };
export default async function RiotDataPage({ searchParams }: PageProps<"/employee/riot">) {
  const user = await currentUser();
  if (!user) redirect("/employee/login");
  if (user.role !== "employee") redirect("/profile");
  const params = await searchParams;
  return <div className="employee-workspace">
    <div className="employee-dashboard-header"><div className="employee-dashboard-brand">
      <Link href="/employee" className="employee-back-link"><ArrowLeft size={15} /><UiText english="Back to workspace" vietnamese="Về trang làm việc" /></Link>
      <h1><UiText english="Riot game data" vietnamese="Dữ liệu game Riot" /></h1>
      <p className="employee-dashboard-desc"><UiText english="Look up accounts, ranks, matches, mastery and game content for League of Legends, TFT and Valorant." vietnamese="Tra cứu tài khoản, rank, trận đấu, thông thạo và nội dung game cho League of Legends, TFT và Valorant." /></p>
    </div></div>
    <RiotDataExplorer connectionStatus={typeof params.connection === "string" ? params.connection : undefined} />
  </div>;
}
