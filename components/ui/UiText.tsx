"use client";
import { useLanguage } from "./LanguageProvider";
import { translateText } from "@/lib/i18n";
export function UiText({ english, vietnamese }: { english: string; vietnamese?: string }) {
  const { text, language } = useLanguage();
  return vietnamese ? translateText(language, english, vietnamese) : text(english);
}
