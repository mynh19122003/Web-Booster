import Image from "next/image";
import { Globe2 } from "lucide-react";

export const COUNTRY_FLAG_MAP: Record<string, { label: string; flagPath: string }> = Object.fromEntries([
  [["korea", "korean", "kr", "ko", "한국어"], "Korea", "kr"],
  [["en", "english"], "English", "us"],
  [["vi", "vn", "vietnamese", "tiếng việt"], "Vietnamese", "vn"],
  [["jp", "ja", "japanese", "日本語"], "Japanese", "jp"],
  [["cn", "zh", "chinese", "中文"], "Chinese", "cn"],
  [["de", "deutsch", "german"], "Deutsch", "de"],
  [["fr", "français", "french"], "Français", "fr"],
  [["es", "español", "spanish"], "Español", "es"],
].flatMap(([keys, label, flag]) => (keys as string[]).map(key => [key, { label: label as string, flagPath: `/images/flags/${flag as string}.svg` }])));

export function LanguageBadge({ language }: { language: string }) {
  const mapped = COUNTRY_FLAG_MAP[language.trim().toLowerCase()];
  return <span className="coach-language-badge">{mapped
    ? <Image className="coach-language-flag country-flag-image" src={mapped.flagPath} alt="" width={24} height={18} />
    : <Globe2 size={20} aria-hidden="true" />}<span>{mapped?.label ?? language}</span></span>;
}
