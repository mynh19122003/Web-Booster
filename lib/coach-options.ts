export const coachLanguageOptions = ["Korea", "English", "Vietnamese", "Japanese", "Chinese"];
const languageAliases: Record<string, string> = {
  korea: "Korea", korean: "Korea", kr: "Korea", ko: "Korea", "한국어": "Korea",
  en: "English", english: "English", vi: "Vietnamese", vn: "Vietnamese", vietnamese: "Vietnamese", "tiếng việt": "Vietnamese",
  jp: "Japanese", ja: "Japanese", japanese: "Japanese", "日本語": "Japanese",
  cn: "Chinese", zh: "Chinese", chinese: "Chinese", "中文": "Chinese",
};
export function normalizeCoachLanguages(values: string[]) {
  return [...new Set(values.map(value => languageAliases[value.trim().toLowerCase()] ?? value.trim()).filter(Boolean))];
}
export function coachRoleOptions(game: string) {
  return game === "valorant" ? ["Duelist", "Initiator", "Controller", "Sentinel"]
    : game === "teamfight-tactics" ? ["Flex", "Economy", "Reroll", "Fast 8", "Compositions"]
    : ["Top", "Jungle", "Mid", "ADC", "Support"];
}
