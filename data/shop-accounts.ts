import { lolChampions } from "./lol-champions";
import { mockLolSkinNames } from "./mock-lol-skins";
export type ShopAccount = {
  id: string; game: string; title: string; rank: string; division: string; server: string;
  level: number; champions: number; skins: number; essence: number; points: number;
  ownedChampions?: string[]; cosmetics: string[]; lpGain: number; price: number; tags: string[]; items: string[];
};

/** Display fixtures only. Replace with inventory records before enabling purchases. */
const accountProfiles: Omit<ShopAccount, "lpGain" | "cosmetics">[] = [
  { id: "DEMO-L01", game: "league-of-legends", title: "Mid lane collection", rank: "Diamond", division: "IV", server: "EUW", level: 146, champions: 112, skins: 38, essence: 26500, points: 250, price: 129, tags: ["Mid", "Collection"], items: ["Ahri", "Lux", "Orianna", "Spirit Blossom Ahri"] },
  { id: "DEMO-L02", game: "league-of-legends", title: "Fresh start", rank: "Unranked", division: "", server: "NA", level: 30, champions: 24, skins: 0, essence: 12000, points: 0, price: 29, tags: ["Smurf", "Unranked"], items: ["Ashe", "Garen", "Annie"] },
  { id: "DEMO-L03", game: "league-of-legends", title: "Support collection", rank: "Emerald", division: "II", server: "EUW", level: 182, champions: 138, skins: 62, essence: 48000, points: 500, price: 109, tags: ["Support", "Collection"], items: ["Thresh", "Nami", "Lulu", "Leona"] },
  { id: "DEMO-L04", game: "league-of-legends", title: "Jungle profile", rank: "Platinum", division: "I", server: "CN", level: 95, champions: 78, skins: 21, essence: 19500, points: 0, price: 79, tags: ["Jungle"], items: ["Lee Sin", "Viego", "Kha'Zix"] },
  { id: "DEMO-L05", game: "league-of-legends", title: "ADC collection", rank: "Gold", division: "II", server: "SEA", level: 118, champions: 95, skins: 35, essence: 22000, points: 125, price: 59, tags: ["ADC", "Collection"], items: ["Jinx", "Kai'Sa", "Caitlyn"] },
  { id: "DEMO-L06", game: "league-of-legends", title: "Top lane profile", rank: "Master", division: "", server: "KR", level: 230, champions: 155, skins: 84, essence: 67000, points: 750, price: 249, tags: ["Top", "Collection"], items: ["Camille", "Fiora", "Jax"] },
  { id: "DEMO-V01", game: "valorant", title: "Duelist collection", rank: "Diamond", division: "2", server: "NA", level: 132, champions: 19, skins: 24, essence: 0, points: 1450, price: 119, tags: ["Duelist", "Collection"], items: ["Jett", "Raze", "Reyna", "Yoru"] },
  { id: "DEMO-V02", game: "valorant", title: "Fresh start", rank: "Unranked", division: "", server: "AP", level: 20, champions: 7, skins: 0, essence: 0, points: 0, price: 25, tags: ["Smurf", "Unranked"], items: ["Sage", "Phoenix", "Sova"] },
  { id: "DEMO-V03", game: "valorant", title: "Controller profile", rank: "Ascendant", division: "1", server: "EU", level: 180, champions: 22, skins: 40, essence: 0, points: 2150, price: 179, tags: ["Controller", "Collection"], items: ["Omen", "Viper", "Brimstone", "Astra"] },
  { id: "DEMO-V04", game: "valorant", title: "Sentinel profile", rank: "Gold", division: "3", server: "EU", level: 78, champions: 14, skins: 12, essence: 0, points: 475, price: 49, tags: ["Sentinel"], items: ["Cypher", "Killjoy", "Sage"] },
];

const tftProfiles: Omit<ShopAccount, "lpGain" | "cosmetics">[] = [
  {
    "id": "DEMO-T01",
    "game": "teamfight-tactics",
    "title": "Little Legend collection",
    "rank": "Diamond",
    "division": "II",
    "server": "EUW",
    "level": 128,
    "champions": 32,
    "skins": 8,
    "essence": 0,
    "points": 450,
    "price": 89,
    "tags": [
      "Ranked",
      "Collection"
    ],
    "items": [
      "Silverwing",
      "Furyhorn",
      "River Sprite"
    ]
  },
  {
    "id": "DEMO-T02",
    "game": "teamfight-tactics",
    "title": "Fresh TFT profile",
    "rank": "Unranked",
    "division": "",
    "server": "NA",
    "level": 30,
    "champions": 3,
    "skins": 1,
    "essence": 0,
    "points": 0,
    "price": 19,
    "tags": [
      "Smurf",
      "Unranked"
    ],
    "items": [
      "River Sprite",
      "Default Arena"
    ]
  },
  {
    "id": "DEMO-T03",
    "game": "teamfight-tactics",
    "title": "Chibi collection",
    "rank": "Master",
    "division": "",
    "server": "CN",
    "level": 210,
    "champions": 46,
    "skins": 14,
    "essence": 0,
    "points": 1250,
    "price": 159,
    "tags": [
      "Ranked",
      "Collection"
    ],
    "items": [
      "Chibi Yasuo",
      "Chibi Lux",
      "Dango"
    ]
  },
  {
    "id": "DEMO-T04",
    "game": "teamfight-tactics",
    "title": "Double Up partners",
    "rank": "Emerald",
    "division": "I",
    "server": "SEA",
    "level": 95,
    "champions": 18,
    "skins": 6,
    "essence": 0,
    "points": 200,
    "price": 49,
    "tags": [
      "Double Up",
      "Collection"
    ],
    "items": [
      "Pengu",
      "Hushtail",
      "Featherknight"
    ]
  },
  {
    "id": "DEMO-T05",
    "game": "teamfight-tactics",
    "title": "Ranked starter",
    "rank": "Gold",
    "division": "III",
    "server": "KR",
    "level": 52,
    "champions": 8,
    "skins": 2,
    "essence": 0,
    "points": 0,
    "price": 29,
    "tags": [
      "Smurf",
      "Ranked"
    ],
    "items": [
      "Molediver",
      "Furyhorn"
    ]
  },
  {
    "id": "DEMO-T06",
    "game": "teamfight-tactics",
    "title": "Arena collector",
    "rank": "Challenger",
    "division": "",
    "server": "OCE",
    "level": 260,
    "champions": 62,
    "skins": 32,
    "essence": 0,
    "points": 2000,
    "price": 299,
    "tags": [
      "Ranked",
      "Collection"
    ],
    "items": [
      "Chibi Jinx",
      "Chibi Ahri",
      "Starmaw"
    ]
  }
];

const mockValorantSkins = [
  "Prime Vandal", "Oni Phantom", "Reaver Sheriff", "Glitchpop Vandal", "Elderflame Operator",
  "Ion Phantom", "Sovereign Ghost", "Singularity Phantom", "Magepunk Vandal", "Prelude to Chaos Vandal",
  "Chronovoid Phantom", "Araxys Vandal", "Ruination Phantom", "Sentinels of Light Vandal", "BlastX Phantom",
  "Kuronami Vandal", "RGX 11z Pro Vandal", "Protocol 781-A Phantom", "Spectrum Phantom", "Gaia's Vengeance Vandal",
];

const mockTftArenas = [
  "Festival Arena", "Sanctuary Arena", "Golden Arena", "Toxitorium Arena", "Kanmei Shrine Arena",
  "Akana Arena", "Lunar Beast Arena", "Mecha Prime Arena", "Star Guardian Classroom", "Choncc's Splash Resort",
];

/** Deterministic display fixtures: 18 LoL, 18 TFT and 12 Valorant accounts. */
export const demoShopAccounts: ShopAccount[] = [...accountProfiles, ...tftProfiles].flatMap((profile, index) =>
  [0, 1, 2].map((variant) => ({
    ...profile,
    id: variant === 0 ? profile.id : profile.id + "-" + (variant + 1),
    title: variant === 0 ? profile.title : profile.title + " · " + (variant === 1 ? "Essential" : "Premium"),
    server: variant === 0 ? profile.server : (
      profile.game === "valorant"
        ? ["NA", "EU", "AP", "KR", "BR", "LATAM"][(index + variant) % 6]
        : ["EUNE", "OCE", "CN", "NA", "EUW", "SEA"][(index + variant) % 6]
    ),
    level: profile.level + variant * 24,
    champions: Math.min(profile.game === "valorant" ? 24 : profile.game === "teamfight-tactics" ? 80 : 170, profile.champions + variant * (profile.game === "valorant" ? 2 : 8)),
    skins: profile.skins + variant * (profile.game === "teamfight-tactics" ? 3 : 12),
    essence: profile.game === "league-of-legends" ? profile.essence + variant * 4500 : 0,
    points: profile.points + variant * 250,
    price: Number((profile.price + variant * (profile.price < 50 ? 15 : 35) + (variant ? 0.99 : 0)).toFixed(2)),
    lpGain: profile.rank === "Unranked" ? 0 : [37, 34, 31, 27, 23, 19, 14, 9, 7][(index + variant * 3) % 9],
    cosmetics: profile.skins === 0 && variant === 0 ? [] : (
      profile.game === "valorant"
        ? mockValorantSkins.slice(variant * 2, variant * 2 + Math.min(mockValorantSkins.length, profile.skins))
        : profile.game === "teamfight-tactics"
          ? mockTftArenas.slice(variant, variant + Math.min(mockTftArenas.length, profile.skins))
          : mockLolSkinNames.slice(variant * 3, variant * 3 + profile.skins + variant * 12)
    ),
    ownedChampions: profile.game === "league-of-legends" ? Array.from(new Set([...profile.items.filter((name) => lolChampions.some((champion) => champion.name === name)), ...(index % 2 === 0 ? ["Zed"] : []), ...lolChampions.map((champion) => champion.name).slice(variant * 8, variant * 8 + Math.min(170, profile.champions + variant * 8))])).slice(0, Math.min(170, profile.champions + variant * 8)) : undefined,
    tags: [...profile.tags],
    items: [...profile.items],
  }))
);
