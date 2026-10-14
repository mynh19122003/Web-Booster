"use client";
import { useWorkflow } from "@/lib/workflow/store";
import { CoachProfile } from "@/components/coaches/CoachProfile";
import { LanguageProvider } from "@/components/ui/LanguageProvider";
import type { Coach } from "@/data/coaches";
import { EmployeeRiotAccount, useEmployeeRiotAccount } from "./EmployeeRiotAccount";
import { riotPlatforms, type MatchHistory } from "@/lib/riot-types";
import { playerRank } from "@/lib/riot-display";
import { EmployeeAvailabilityToggle } from "./EmployeeAvailabilityToggle";

export function EmployeeProfessionalProfile() {
  const employee = useWorkflow(state => state.employees.find(row => row.id === state.employeeId));
  const riot = useEmployeeRiotAccount(employee);
  if (!employee) return <p role="status">Đang tải hồ sơ chuyên môn…</p>;
  const gameNames: Record<string, string> = { "League of Legends": "league-of-legends", Valorant: "valorant", "Teamfight Tactics": "teamfight-tactics" };
  const coach: Coach = {
    ...{
      slug: `employee-${employee.id}`, name: employee.name, game: gameNames[employee.games[0]] ?? "league-of-legends",
      gameName: employee.games[0] ?? "League of Legends", peakRank: "—", rating: 0, reviewCount: 0,
      isMvp: false, hourlyRate: 0, online: false, server: "VN", sessionFormats: ["live"] as ("live" | "vod")[],
      languages: [], roles: [], students: 0, yearsCoaching: 0, bioKey: "coachBioLuna" as const,
      bioOverride: "", accent: "#ffa333",
    },
    name: employee.name,
    online: employee.online,
    ...{
      slug: `employee-${employee.id}`, game: gameNames[employee.games[0]] ?? "league-of-legends", gameName: employee.games[0],
      peakRank: employee.rank.split(" / ")[0], rating: 0, reviewCount: 0, isMvp: false,
      bioOverride: `${employee.type === "COACH" ? "Huấn luyện" : "Nâng hạng"} · ${employee.games.join(" · ")}`,
    },
  };
  coach.server = riot ? riotPlatforms[riot.platform] : "VN";
  if (riot) { coach.gameName = riot.game; coach.game = gameNames[riot.game]; }
  const history: MatchHistory = riot?.history ?? { status: "unlinked", matches: [] };
  const rank = playerRank(history, coach.game === "teamfight-tactics");
  coach.peakRank = rank ? `${rank.tier.charAt(0)}${rank.tier.slice(1).toLowerCase()}${["MASTER", "GRANDMASTER", "CHALLENGER"].includes(rank.tier) ? "" : ` ${rank.division}`}` : history.status === "ready" && !history.rankError ? "Unranked" : "—";
  return <LanguageProvider><div className="employee-professional-profile">
    <EmployeeRiotAccount key={employee.id} employee={employee} saved={riot} />
    <CoachProfile key={`${employee.id}:${riot?.riotId}:${riot?.game}:${riot?.platform}:${history.updatedAt}`} coach={coach} initialHistory={history} employeeView={{ specialization: employee.type === "COACH" ? "Coach · Huấn luyện" : "Booster · Nâng hạng", games: employee.games, completedOrders: employee.completedOrders, riotId: riot?.riotId ?? employee.riotId, riotRank: rank, showGameplay: true, avatarInitials: employee.name.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join(""), availabilityControl: <EmployeeAvailabilityToggle /> }} />
  </div></LanguageProvider>;
}
