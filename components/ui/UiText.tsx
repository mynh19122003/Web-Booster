"use client";
import { useLanguage } from "./LanguageProvider";
export function UiText({ english }: { english: string }) {
  const { text } = useLanguage();
  return text(english);
}
