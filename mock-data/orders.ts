import type {
  Order,
  EmployeeCandidate,
  OrderStatus,
  Game,
} from "@/types/operations";
const now = Date.now();
export const ago = (minutes: number) =>
  new Date(now - minutes * 60000).toISOString();
export const employees: EmployeeCandidate[] = [
  {
    id: "emp-nova",
    name: "Nova",
    type: "BOOSTER",
    games: ["League of Legends", "Teamfight Tactics"],
    rank: "Master",
    online: true,
    maxActiveOrders: 3,
    successRate: 98.4,
    averageHours: 18,
    lastActivity: ago(2),
  },
  {
    id: "emp-zen",
    name: "Zen",
    type: "BOOSTER",
    games: ["League of Legends", "Valorant"],
    rank: "Challenger / Radiant",
    online: true,
    maxActiveOrders: 4,
    successRate: 99.1,
    averageHours: 16,
    lastActivity: ago(1),
  },
  {
    id: "emp-luna",
    name: "Luna",
    type: "COACH",
    games: ["League of Legends", "Valorant"],
    rank: "Challenger / Immortal",
    online: true,
    maxActiveOrders: 2,
    successRate: 99.8,
    averageHours: 2,
    lastActivity: ago(4),
  },
  {
    id: "emp-zero",
    name: "Zero",
    type: "BOOSTER",
    games: ["Valorant"],
    rank: "Radiant",
    online: false,
    maxActiveOrders: 2,
    successRate: 97.9,
    averageHours: 22,
    lastActivity: ago(90),
  },
];
const rows: [string, string, OrderStatus, Game, number, number, string?][] = [
  ["ASC-1049", "Theo Martin", "PENDING", "League of Legends", 0, 119],
  ["ASC-1048", "Ava Chen", "PENDING", "Valorant", 0, 74],
  ["ASC-1047", "Leo Nguyen", "CONFIRMED", "League of Legends", 0, 59],
  ["ASC-1046", "Mia Wilson", "WAITING_ASSIGNMENT", "Valorant", 0, 129],
  ["ASC-1045", "Noah Park", "WAITING_ASSIGNMENT", "League of Legends", 0, 49],
  ["ASC-1044", "Ella Garcia", "CONFIRMED", "Teamfight Tactics", 0, 69],
  [
    "ASC-1043",
    "Lucas Brown",
    "OFFERED",
    "League of Legends",
    0,
    109,
    "emp-zen",
  ],
  [
    "ASC-1042",
    "Mynh Dat",
    "IN_PROGRESS",
    "League of Legends",
    64,
    89,
    "emp-nova",
  ],
  ["ASC-1041", "Ruby Lee", "ACCEPTED", "Valorant", 0, 99, "emp-zen"],
  [
    "ASC-1040",
    "Oscar Davis",
    "PAUSED",
    "League of Legends",
    42,
    79,
    "emp-nova",
  ],
  ["ASC-1039", "Chloe Reed", "COMPLETED", "Valorant", 100, 139, "emp-zero"],
  ["ASC-1038", "Ethan Kim", "DISPUTED", "League of Legends", 76, 99, "emp-zen"],
  ["ASC-1037", "Ivy Taylor", "CANCELLED", "Teamfight Tactics", 0, 59],
  ["ASC-1036", "Finn Scott", "REFUNDED", "Valorant", 0, 84],
  ["ASC-1035", "Aria Lopez", "PENDING", "League of Legends", 0, 45],
  ["ASC-1034", "Kai Evans", "WAITING_ASSIGNMENT", "Valorant", 0, 65],
];
export const orders: Order[] = rows.map(
  ([id, name, status, game, progress, amount, employeeId], i) => ({
    id,
    customer: {
      id: `cus-${i}`,
      name,
      email: `${name.toLowerCase().replaceAll(" ", ".")}@example.com`,
      country: i % 2 ? "Vietnam" : "United States",
      timezone: i % 2 ? "Asia/Ho_Chi_Minh" : "America/New_York",
    },
    game,
    service:
      i === 4 || i === 14
        ? "Coaching"
        : i === 5
          ? "Placement Matches"
          : "Rank Boost",
    riotId: `${name.split(" ")[0]}#${i % 2 ? "VN2" : "NA1"}`,
    region: i % 2 ? "Vietnam" : "North America",
    currentRank: game === "Valorant" ? "Platinum I" : "Emerald IV",
    targetRank: game === "Valorant" ? "Diamond I" : "Diamond IV",
    currentLP: progress ? 62 : 24,
    milestones:
      game === "Valorant"
        ? ["Platinum I", "Platinum II", "Platinum III", "Diamond I"]
        : [
            "Emerald IV",
            "Emerald III",
            "Emerald II",
            "Emerald I",
            "Diamond IV",
          ],
    queue: "Solo / Duo",
    options:
      i % 2 ? ["Offline mode", "Stream sessions"] : ["Preferred champions"],
    priority: i % 3 === 0 ? "Priority" : "Standard",
    status,
    progress,
    amount,
    employeeId,
    createdAt: ago(i < 3 ? 3 + i * 15 : i * 85),
    deadline: new Date(now + (36 + i) * 3600000).toISOString(),
    instructions:
      "Please play after 18:00 in my timezone. Keep me updated after each session.",
    adminNotes:
      id === "ASC-1042"
        ? "Customer requested a progress update. Keep communication clear."
        : "",
    employeeNotes: progress
      ? "Session going well. Next update after the evening games."
      : "",
  }),
);
