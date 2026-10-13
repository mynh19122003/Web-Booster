import chatPreview from "./chat-preview.json";
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
export const mockRequests = structuredClone(chatPreview.requests) as CustomerRequest[];
export const mockMessages: Record<string, SupportMessage[]> = Object.fromEntries(mockRequests.map(request => [request.id, [
  { id: `${request.id}-1`, senderId: mockCustomer.id, senderName: mockCustomer.name, senderRole: "customer", text: "Mình muốn trao đổi về lịch chơi và mục tiêu của mình.", createdAt: request.updatedAt - 60000 },
  { id: `${request.id}-intro`, senderId: request.employeeId!, senderName: request.employeeName!, senderRole: "employee", text: "Chào Minh Anh 👋", createdAt: request.updatedAt - 55000 },
  { id: `${request.id}-schedule`, senderId: request.employeeId!, senderName: request.employeeName!, senderRole: "employee", text: "Bạn muốn bắt đầu lúc mấy giờ?", createdAt: request.updatedAt - 50000 },
  { id: `${request.id}-goal`, senderId: request.employeeId!, senderName: request.employeeName!, senderRole: "employee", text: "Mình sẽ chuẩn bị kế hoạch theo mục tiêu của bạn.", createdAt: request.updatedAt - 45000 },
  { id: `${request.id}-answer`, senderId: mockCustomer.id, senderName: mockCustomer.name, senderRole: "customer", text: "Khoảng 20:00 tối nay nhé 😊", createdAt: request.updatedAt - 30000 },
  { id: `${request.id}-confirm`, senderId: request.employeeId!, senderName: request.employeeName!, senderRole: "employee", text: "Được nhé! Hẹn gặp bạn lúc 20:00.", createdAt: request.updatedAt - 20000 },
  { id: `${request.id}-thanks`, senderId: mockCustomer.id, senderName: mockCustomer.name, senderRole: "customer", text: "Cảm ơn bạn 👍", createdAt: request.updatedAt - 10000 },
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
