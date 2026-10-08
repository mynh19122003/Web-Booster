import { lolChampions } from "@/data/lol-champions";
import { mockLolSkins } from "@/data/mock-lol-skins";
import { lolChampionImageKeys, lolImageVersion } from "@/data/lol-champion-image-keys";
import { lolSplashFallbacks } from "@/data/lol-splash-fallbacks";

/** Resolve mock skin splash art, with champion illustrations as a fallback. */
export function accountArtwork(game: string, name: string): string | null {
  if (game !== "league-of-legends") return null;
  const skin = mockLolSkins.find((item) => item.name === name);
  if (skin) return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${skin.championId}_${skin.number}.jpg`;
  const normalized = name.toLowerCase();
  const champion = lolChampions.find((item) => normalized === item.name.toLowerCase()
    || normalized.endsWith(` ${item.name.toLowerCase()}`));
  return champion ? `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_0.jpg` : null;
}

export function accountArtworkLabel(game: string, name: string) {
  return game === "league-of-legends" && mockLolSkins.some((skin) => skin.name === name) ? "Skin preview" : "Champion artwork";
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
  const skin = mockLolSkins.find((item) => item.name === name);
  const champion = lolChampions.find((item) => name.toLowerCase() === item.name.toLowerCase()
    || name.toLowerCase().endsWith(` ${item.name.toLowerCase()}`));
  const fallback = skin ? lolSplashFallbacks[`${skin.championId}_${skin.number}`]
    : champion ? lolSplashFallbacks[`${champion.id}_0`] : undefined;
  return [primary, ...(fallback ? [fallback] : [])];
}
