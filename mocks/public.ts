import type { Coach } from "@/data/coaches";
import { coaches } from "@/data/coaches";
import type { AuthUser } from "@/lib/auth-db";
import type { CustomerRequest, SupportMessage } from "@/lib/chat-types";
import type { MatchHistory, CoachChampionStats } from "@/lib/riot-types";

export const mockCustomer: AuthUser = { id: "demo-customer", name: "Minh Anh", email: "minhanh@ascend.demo", role: "customer" };
export const mockProfile = { ...mockCustomer, phone: "+84901234567", country: "VN", discord: "minhanh.demo", avatar: null as string | null };
export const mockCoaches: Coach[] = [
  ...coaches,
  { ...coaches[0], slug: "rift", name: "Rift", online: false, hourlyRate: 28, roles: ["Jungle", "Top"], reviewCount: 142, bioKey: "coachBioRift" },
  { ...coaches[0], slug: "nova", name: "Nova", game: "valorant", gameName: "Valorant", peakRank: "Radiant", server: "AP", hourlyRate: 22, roles: ["Duelist", "Initiator"], bioKey: "coachBioNova" },
  { ...coaches[0], slug: "mira", name: "Mira", game: "teamfight-tactics", gameName: "Teamfight Tactics", hourlyRate: 18, roles: [], bioKey: "coachBioMira" },
];
const date = Date.UTC(2026, 9, 12, 3);
export const mockRequests: CustomerRequest[] = [
  { id: "DEMO-1054", subject: "Coaching League of Legends", game: "league-of-legends", status: "assigned", customerId: mockCustomer.id, customerName: mockCustomer.name, employeeId: "demo-luna", employeeName: "Luna", employeeOnline: 1, updatedAt: date, lastMessage: "Chào Minh Anh! Mình đã sẵn sàng cho buổi coaching của bạn." },
  { id: "DEMO-1053", subject: "Hỗ trợ đơn hàng Valorant", game: "valorant", status: "resolved", customerId: mockCustomer.id, customerName: mockCustomer.name, employeeId: "demo-nova", employeeName: "Nova", employeeOnline: 0, updatedAt: date - 86400000, lastMessage: "Đơn hàng mẫu đã hoàn tất. Cảm ơn bạn!" },
];
export const mockMessages: Record<string, SupportMessage[]> = Object.fromEntries(mockRequests.map(request => [request.id, [
  { id: `${request.id}-1`, senderId: mockCustomer.id, senderName: mockCustomer.name, senderRole: "customer", text: "Mình muốn trao đổi về lịch chơi và mục tiêu của mình.", createdAt: request.updatedAt - 60000 },
  { id: `${request.id}-2`, senderId: request.employeeId!, senderName: request.employeeName!, senderRole: "employee", text: request.lastMessage, createdAt: request.updatedAt },
]]));
export const mockMatchHistory: MatchHistory = {
  status: "ready", account: { gameName: "LunaDemo", tagLine: "DEMO", platform: "euw1" }, updatedAt: date,
  ranks: [{ queue: "RANKED_SOLO_5x5", tier: "CHALLENGER", division: "I", leaguePoints: 824, wins: 186, losses: 92 }],
  matches: ["Ahri", "Lux", "Annie", "Ahri", "Lux"].map((pick, index) => ({ id: `DEMO-MATCH-${index}`, pick, queueId: 420, won: index !== 2, role: "MIDDLE", mode: "CLASSIC", kills: 8 + index, deaths: 2 + index, assists: 12 - index, duration: 1800 + index * 120, playedAt: date - index * 3600000 })),
};
export const mockChampionStats: CoachChampionStats = { status: "ready", sampleSize: 30, updatedAt: date, topChampions: [
  { championId: 103, championKey: "Ahri", championName: "Ahri", gamesPlayed: 14, wins: 11, winRate: 79 },
  { championId: 99, championKey: "Lux", championName: "Lux", gamesPlayed: 10, wins: 7, winRate: 70 },
  { championId: 1, championKey: "Annie", championName: "Annie", gamesPlayed: 6, wins: 4, winRate: 67 },
] };
