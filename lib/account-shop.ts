import type { ShopAccount } from "@/data/shop-accounts";

export type AccountFilters = {
  search: string;
  server: string;
  ranks: string[];
  championsMin: number;
  skinsMin: number;
  pointsMin: number;
  lpMin: number;
  lowGain: boolean;
  ownedItems: string[];
  skinQuery: string;
  role: string;
  smurfOnly: boolean;
  min: string;
  max: string;
  favoritesOnly: boolean;
};

export function defaultAccountFilters(smurfs: boolean): AccountFilters {
  return { search: "", server: "all", ranks: [], championsMin: 0, skinsMin: 0, pointsMin: 0,
    lpMin: 0, lowGain: false, ownedItems: [], skinQuery: "", role: "all", smurfOnly: smurfs,
    min: "", max: "", favoritesOnly: false };
}

export function accountReference(id: string) {
  return id.replace(/^DEMO-/, "ASC-");
}

const normalize = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function matchesAccount(account: ShopAccount, filters: AccountFilters, favorites: readonly string[]) {
  if (filters.server !== "all" && account.server !== filters.server) return false;
  if (filters.ranks.length && !filters.ranks.includes(account.rank)) return false;
  if (filters.smurfOnly && !account.tags.includes("Smurf")) return false;
  if (filters.favoritesOnly && !favorites.includes(account.id)) return false;
  if (account.champions < filters.championsMin || account.skins < filters.skinsMin || account.points < filters.pointsMin || account.lpGain < filters.lpMin) return false;
  if (filters.lowGain && (account.lpGain <= 0 || account.lpGain >= 9)) return false;
  if (filters.role !== "all" && !account.tags.includes(filters.role)) return false;
  if (filters.min && account.price < Number(filters.min)) return false;
  if (filters.max && account.price > Number(filters.max)) return false;
  if (!filters.ownedItems.every(name => (account.ownedChampions ?? account.items).includes(name))) return false;
  if (filters.skinQuery.trim() && !account.cosmetics.some(name => normalize(name).includes(normalize(filters.skinQuery.trim())))) return false;

  let query = normalize(filters.search.trim());
  for (const match of query.matchAll(/\b(\d[\d,.]*)\s*(rp|vp|be)\b/g)) {
    const balance = match[2] === "be" ? account.essence : account.points;
    if (balance < Number(match[1].replace(/[,.]/g, ""))) return false;
    query = query.replace(match[0], "");
  }
  const haystack = normalize([account.title, account.id, accountReference(account.id), account.rank, account.server,
    ...account.tags, ...account.items, ...account.cosmetics, ...(account.ownedChampions ?? [])].join(" "));
  return query.split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
}
