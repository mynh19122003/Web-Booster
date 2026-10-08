import { games } from "@/data/games";
import { rankLevelsFor } from "@/lib/service-options";

export type GameConfig = {
  id: string;
  name: string;
  slug: string;
  short: string;
  logo: string;
  heroTitle: string;
  heroDescription: string;
  tiers: { id: string; name: string; icon: string }[];
  queues: string[];
  roles?: string[];
  services: string[];
};

const queueOptions: Record<string, string[]> = {
  "league-of-legends": ["Solo", "Flex 5v5"],
  "teamfight-tactics": ["Ranked", "Hyper Roll", "Double Up"],
  valorant: ["Competitive", "Premier"],
};

const heroCopy: Record<string, { title: string; description: string }> = {
  "league-of-legends": {
    title: "League of Legends.",
    description: "Rank boost, Duo boost, Placements, Coaching. Choose a service, set your goal and build a plan around your play.",
  },
  "teamfight-tactics": {
    title: "Teamfight Tactics.",
    description: "Climb the ladder with high-tier comps, coaching, and a plan built around your play.",
  },
  valorant: {
    title: "Valorant.",
    description: "Build a clear path through the ranks with verified high-tier players and personalized coaching.",
  },
};

export const GAMES_DATA: Record<string, GameConfig> = Object.fromEntries(
  games.map((game) => {
    const copy = heroCopy[game.slug];
    const tiers = rankLevelsFor(game.slug);
    return [game.slug, {
      id: game.slug === "teamfight-tactics" ? "tft" : game.slug === "league-of-legends" ? "lol" : game.slug,
      name: game.name,
      slug: game.slug,
      short: game.short,
      logo: game.logo,
      heroTitle: copy.title,
      heroDescription: copy.description,
      tiers: tiers.map((tier) => ({ id: tier.label.toLowerCase().replaceAll(" ", "-"), name: tier.label, icon: tier.icon })),
      queues: queueOptions[game.slug],
      roles: game.slug === "league-of-legends" ? ["Top", "Jungle", "Mid", "ADC", "Support"] : game.slug === "valorant" ? ["Duelist", "Initiator", "Controller", "Sentinel"] : undefined,
      services: game.services,
    }];
  }),
) as Record<string, GameConfig>;

export const gameConfigFor = (slug: string) =>
  GAMES_DATA[slug] ?? GAMES_DATA["league-of-legends"];
