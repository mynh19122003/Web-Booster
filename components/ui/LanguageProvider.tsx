"use client";

import { createContext, useContext, useEffect, useSyncExternalStore } from "react";
import { intlLocales, isLanguageCode, translate, type LanguageCode, type MessageKey } from "@/lib/i18n";

const LanguageContext = createContext<LanguageCode>("en");

const languageEvent = "ascend-language-changed";
let sessionLanguage: LanguageCode | undefined;
const subscribe = (callback: () => void) => {
  window.addEventListener("storage", callback);
  window.addEventListener(languageEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(languageEvent, callback);
  };
};
export function setLanguage(language: LanguageCode) {
  sessionLanguage = language;
  try { window.localStorage.setItem("ascend-language", language); } catch { /* Keep the session choice. */ }
  window.dispatchEvent(new Event(languageEvent));
}
const getServerLanguage = (): LanguageCode => "en";
const getSavedLanguage = (): LanguageCode => {
  try {
    const saved = window.localStorage.getItem("ascend-language");
    return isLanguageCode(saved) ? saved : sessionLanguage ?? "en";
  } catch {
    return sessionLanguage ?? "en";
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(subscribe, getSavedLanguage, getServerLanguage);

  useEffect(() => {
    const previousLang = document.documentElement.lang;
    const previousDir = document.documentElement.dir;
    document.documentElement.lang = intlLocales[language];
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    return () => {
      document.documentElement.lang = previousLang;
      document.documentElement.dir = previousDir;
    };
  }, [language]);

  return <LanguageContext.Provider value={language}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const language = useContext(LanguageContext);
  return { language, t: (key: MessageKey, params?: Record<string, string | number>) => translate(language, key, params) };
}
