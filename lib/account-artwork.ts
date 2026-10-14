import { lolChampions } from "@/data/lol-champions";
import { lolChampionImageKeys, lolImageVersion } from "@/data/lol-champion-image-keys";
import { lolSplashFallbacks } from "@/data/lol-splash-fallbacks";

/** Resolve champion artwork for verified inventory records. */
export function accountArtwork(game: string, name: string): string | null {
  if (game !== "league-of-legends") return null;
  const normalized = name.toLowerCase();
  const champion = lolChampions.find((item) => normalized === item.name.toLowerCase()
    || normalized.endsWith(` ${item.name.toLowerCase()}`));
  return champion ? `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg` : null;
}

export function accountArtworkLabel(game: string) {
  return game === "league-of-legends" ? "Champion artwork" : "Account artwork";
}

export function championIconSources(name: string, championId?: string): string[] {
  const champion = lolChampions.find((item) => item.name === name);
  const id = championId ?? champion?.id;
  if (!id) return [];
  const key = lolChampionImageKeys[id];
  return [
    `https://ddragon.leagueoflegends.com/cdn/${lolImageVersion}/img/champion/${id}.png`,
    ...(key ? [`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${key}.png`] : []),
  ];
}

export function accountArtworkSources(game: string, name: string): string[] {
  const primary = accountArtwork(game, name);
  if (!primary) return [];
  const champion = lolChampions.find((item) => name.toLowerCase() === item.name.toLowerCase()
    || name.toLowerCase().endsWith(` ${item.name.toLowerCase()}`));
  const fallback = champion ? lolSplashFallbacks[`${champion.id}_0`] : undefined;
  return [primary, ...(fallback ? [fallback] : [])];
}
