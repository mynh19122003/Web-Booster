import type { RegionOption } from "@/components/ui/RegionSelector";

export const lolRegions: readonly RegionOption[] = [
  { code: "EUW", name: "Europe West", flag: "/images/flags/eu.svg" },
  { code: "EUNE", name: "Europe Nordic & East", flag: "/images/flags/eu.svg" },
  { code: "NA", name: "North America", flag: "/images/flags/us.svg" },
  { code: "OCE", name: "Oceania", flag: "/images/flags/au.svg" },
  { code: "KR", name: "Korea", flag: "/images/flags/kr.svg" },
  { code: "CN", name: "China", flag: "/images/flags/cn.svg" },
  { code: "SEA", name: "Southeast Asia", flag: "/images/flags/sg.svg" },
];

export const valorantRegions: readonly RegionOption[] = [
  { code: "NA", name: "North America", flag: "/images/flags/us.svg" },
  { code: "EU", name: "Europe", flag: "/images/flags/eu.svg" },
  { code: "AP", name: "Asia-Pacific", flag: "/images/flags/sg.svg" },
  { code: "KR", name: "Korea", flag: "/images/flags/kr.svg" },
  { code: "BR", name: "Brazil", flag: "/images/flags/us.svg" },
  { code: "LATAM", name: "Latin America", flag: "/images/flags/es.svg" },
];

export const tftRegions: readonly RegionOption[] = [
  { code: "EUW", name: "Europe West", flag: "/images/flags/eu.svg" },
  { code: "EUNE", name: "Europe Nordic & East", flag: "/images/flags/eu.svg" },
  { code: "NA", name: "North America", flag: "/images/flags/us.svg" },
  { code: "OCE", name: "Oceania", flag: "/images/flags/au.svg" },
  { code: "KR", name: "Korea", flag: "/images/flags/kr.svg" },
  { code: "SEA", name: "Southeast Asia", flag: "/images/flags/sg.svg" },
];

export const regions: readonly RegionOption[] = lolRegions;

export function regionsForGame(game: string): readonly RegionOption[] {
  if (game === "valorant") return valorantRegions;
  if (game === "teamfight-tactics") return tftRegions;
  return lolRegions;
}
