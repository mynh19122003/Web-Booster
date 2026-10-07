import {
  BookOpen,
  Crown,
  Gamepad2,
  GraduationCap,
  Medal,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  UserRound,
  Users,
  WandSparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type ProductCategory = {
  id: string;
  label: string;
  icon: LucideIcon;
  service?: string;
  queue?: string;
};

export const productsByGame: Record<string, ProductCategory[]> = {
  "league-of-legends": [
    { id: "divisions", label: "Pro Divisions", icon: Crown, service: "rank-boost" },
    { id: "games", label: "Pro Games", icon: Gamepad2, service: "duo-boost" },
    { id: "wins", label: "Pro Wins", icon: Trophy },
    { id: "placements", label: "Placements", icon: Medal, service: "placements" },
    { id: "accounts", label: "Accounts", icon: UserRound },
    { id: "smurfs", label: "Smurfs", icon: Sparkles },
    { id: "coaching", label: "Coaching", icon: GraduationCap, service: "coaching" },
    { id: "normals", label: "Normals", icon: Users },
    { id: "mastery", label: "Champion Mastery", icon: WandSparkles },
    { id: "challenges", label: "Challenges", icon: Target },
    { id: "battle-pass", label: "Battle Pass", icon: Zap },
    { id: "honor", label: "Honor", icon: Shield },
    { id: "clash", label: "Clash", icon: Swords },
    { id: "arena", label: "Arena", icon: BookOpen },
  ],
  "teamfight-tactics": [
    { id: "divisions", label: "Divisions", icon: Crown, service: "rank-boost" },
    { id: "double-up", label: "Double Up", icon: Users, service: "rank-boost", queue: "Double Up" },
    { id: "set-pass", label: "Set Pass", icon: Sparkles },
    { id: "ranked-wins", label: "Ranked Wins", icon: Trophy },
    { id: "placements", label: "Placements", icon: Medal, service: "placements" },
    { id: "accounts", label: "Accounts", icon: UserRound },
    { id: "smurfs", label: "Smurfs", icon: Sparkles },
    { id: "coaching", label: "Coaching", icon: GraduationCap, service: "coaching" },
  ],
  valorant: [
    { id: "ranks", label: "Pro Ranks", icon: Crown, service: "rank-boost" },
    { id: "games", label: "Pro Games", icon: Gamepad2, service: "duo-boost" },
    { id: "wins", label: "Pro Wins", icon: Trophy },
    { id: "placements", label: "Placements", icon: Medal, service: "placements" },
    { id: "coaching", label: "Coaching", icon: GraduationCap, service: "coaching" },
    { id: "unrated", label: "Unrated", icon: Swords },
    { id: "battle-pass", label: "Battle Pass", icon: Zap },
    { id: "challenges", label: "Challenges", icon: Target },
    { id: "accounts", label: "Accounts", icon: UserRound },
    { id: "smurfs", label: "Smurfs", icon: Sparkles },
  ],
};

export const categoryKeys: Record<string, string> = {
  divisions: "categoryDivisions", "pro-divisions": "categoryProDivisions", ranks: "categoryProRanks",
  games: "categoryProGames", wins: "categoryProWins", placements: "categoryPlacements", accounts: "categoryAccounts",
  smurfs: "categorySmurfs", coaching: "categoryCoaching", normals: "categoryNormals", mastery: "categoryChampionMastery",
  challenges: "categoryChallenges", "battle-pass": "categoryBattlePass", honor: "categoryHonor", clash: "categoryClash",
  arena: "categoryArena", "double-up": "categoryDoubleUp", "set-pass": "categorySetPass", "ranked-wins": "categoryRankedWins", unrated: "categoryUnrated",
};

