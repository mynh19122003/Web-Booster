import { authMessages } from "./i18n/catalog/auth";
import { commonMessages } from "./i18n/catalog/common";
import { dialogsMessages } from "./i18n/catalog/dialogs";
import { homeMessages } from "./i18n/catalog/home";
import { layoutMessages } from "./i18n/catalog/layout";
import { pagesMessages } from "./i18n/catalog/pages";
import { rankMessages } from "./i18n/catalog/rank";
import { regionsMessages } from "./i18n/catalog/regions";
import { servicesMessages } from "./i18n/catalog/services";
import { supportMessages } from "./i18n/catalog/support";
import { coachesMessages } from "./i18n/catalog/coaches";
import { deMessages } from "./i18n/catalog/locales/de";
import { frMessages } from "./i18n/catalog/locales/fr";
import { esMessages } from "./i18n/catalog/locales/es";
import { ptMessages } from "./i18n/catalog/locales/pt";
import { itMessages } from "./i18n/catalog/locales/it";
import { nlMessages } from "./i18n/catalog/locales/nl";
import { jaMessages } from "./i18n/catalog/locales/ja";
import { ruMessages } from "./i18n/catalog/locales/ru";
import { plMessages } from "./i18n/catalog/locales/pl";
import { svMessages } from "./i18n/catalog/locales/sv";
import { roMessages } from "./i18n/catalog/locales/ro";
import { csMessages } from "./i18n/catalog/locales/cs";
import { noMessages } from "./i18n/catalog/locales/no";
import { daMessages } from "./i18n/catalog/locales/da";
import { fiMessages } from "./i18n/catalog/locales/fi";
import { bgMessages } from "./i18n/catalog/locales/bg";
import { huMessages } from "./i18n/catalog/locales/hu";
import { hrMessages } from "./i18n/catalog/locales/hr";
import { arMessages } from "./i18n/catalog/locales/ar";
import { trMessages } from "./i18n/catalog/locales/tr";
import { uiPhrases } from "./i18n/ui-phrases";
import { commercePhrases } from "./i18n/commerce-phrases";
import { generatedUiPhrases } from "./i18n/generated-ui-phrases";

export const languages = [
  { code: "en", short: "EN", name: "English", country: "United Kingdom", flagCode: "gb" },
  { code: "de", short: "DE", name: "Deutsch", country: "Deutschland", flagCode: "de" },
  { code: "fr", short: "FR", name: "Français", country: "France", flagCode: "fr" },
  { code: "es", short: "ES", name: "Español", country: "España", flagCode: "es" },
  { code: "pt", short: "PT", name: "Português", country: "Portugal", flagCode: "pt" },
  { code: "it", short: "IT", name: "Italiano", country: "Italia", flagCode: "it" },
  { code: "nl", short: "NL", name: "Nederlands", country: "Nederland", flagCode: "nl" },
  { code: "ja", short: "JA", name: "日本語", country: "日本", flagCode: "jp" },
  { code: "ru", short: "RU", name: "Русский", country: "Россия", flagCode: "ru" },
  { code: "pl", short: "PL", name: "Polski", country: "Polska", flagCode: "pl" },
  { code: "sv", short: "SV", name: "Svenska", country: "Sverige", flagCode: "se" },
  { code: "ro", short: "RO", name: "Română", country: "România", flagCode: "ro" },
  { code: "cs", short: "CS", name: "Čeština", country: "Česko", flagCode: "cz" },
  { code: "no", short: "NO", name: "Norsk", country: "Norge", flagCode: "no" },
  { code: "da", short: "DA", name: "Dansk", country: "Danmark", flagCode: "dk" },
  { code: "fi", short: "FI", name: "Suomi", country: "Suomi", flagCode: "fi" },
  { code: "bg", short: "BG", name: "Български", country: "България", flagCode: "bg" },
  { code: "hu", short: "HU", name: "Magyar", country: "Magyarország", flagCode: "hu" },
  { code: "hr", short: "HR", name: "Hrvatski", country: "Hrvatska", flagCode: "hr" },
  { code: "ar", short: "AR", name: "العربية", country: "الإمارات العربية المتحدة", flagCode: "ae" },
  { code: "tr", short: "TR", name: "Türkçe", country: "Türkiye", flagCode: "tr" },
  { code: "zh", short: "ZH", name: "中文", country: "中国", flagCode: "cn" },
  { code: "vi", short: "VI", name: "Tiếng Việt", country: "Việt Nam", flagCode: "vn" },
  { code: "ko", short: "KO", name: "한국어", country: "대한민국", flagCode: "kr" },
] as const;

export type LanguageCode = (typeof languages)[number]["code"];

export function isLanguageCode(value: string | null): value is LanguageCode {
  return languages.some((language) => language.code === value);
}

export const intlLocales: Record<LanguageCode, string> = {
  en: "en-GB",
  vi: "vi-VN",
  zh: "zh-CN",
  ko: "ko-KR",
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  pt: "pt-PT",
  it: "it-IT",
  nl: "nl-NL",
  ja: "ja-JP",
  ru: "ru-RU",
  pl: "pl-PL",
  sv: "sv-SE",
  ro: "ro-RO",
  cs: "cs-CZ",
  no: "nb-NO",
  da: "da-DK",
  fi: "fi-FI",
  bg: "bg-BG",
  hu: "hu-HU",
  hr: "hr-HR",
  ar: "ar-AE",
  tr: "tr-TR",
};

const supportedMessages = {
  en: { ...authMessages.en, ...commonMessages.en, ...dialogsMessages.en, ...homeMessages.en, ...layoutMessages.en, ...pagesMessages.en, ...rankMessages.en, ...regionsMessages.en, ...servicesMessages.en, ...supportMessages.en, ...coachesMessages.en },
  vi: { ...authMessages.vi, ...commonMessages.vi, ...dialogsMessages.vi, ...homeMessages.vi, ...layoutMessages.vi, ...pagesMessages.vi, ...rankMessages.vi, ...regionsMessages.vi, ...servicesMessages.vi, ...supportMessages.vi, ...coachesMessages.vi },
  zh: { ...authMessages.zh, ...commonMessages.zh, ...dialogsMessages.zh, ...homeMessages.zh, ...layoutMessages.zh, ...pagesMessages.zh, ...rankMessages.zh, ...regionsMessages.zh, ...servicesMessages.zh, ...supportMessages.zh, ...coachesMessages.zh },
  ko: { ...authMessages.ko, ...commonMessages.ko, ...dialogsMessages.ko, ...homeMessages.ko, ...layoutMessages.ko, ...pagesMessages.ko, ...rankMessages.ko, ...regionsMessages.ko, ...servicesMessages.ko, ...supportMessages.ko, ...coachesMessages.ko },
} as const;

type SupportedLanguage = keyof typeof supportedMessages;
export type MessageKey = keyof typeof supportedMessages.en;
const extendedMessages: Partial<Record<LanguageCode, Partial<Record<MessageKey, string>>>> = {
  de: deMessages, fr: frMessages, es: esMessages, pt: ptMessages, it: itMessages,
  nl: nlMessages, ja: jaMessages, ru: ruMessages, pl: plMessages, sv: svMessages,
  ro: roMessages, cs: csMessages, no: noMessages, da: daMessages, fi: fiMessages,
  bg: bgMessages, hu: huMessages, hr: hrMessages, ar: arMessages, tr: trMessages,
};
const messages = Object.fromEntries(
  languages.map(({ code }) => [
    code,
    {
      ...(supportedMessages[code as SupportedLanguage] ?? supportedMessages.en),
      ...extendedMessages[code],
    },
  ]),
) as Record<LanguageCode, Partial<Record<MessageKey, string>>>;

export function translate(
  language: LanguageCode,
  key: MessageKey,
  params?: Record<string, string | number>,
): string {
  const template = messages[language][key] ?? supportedMessages.en[key];
  return params
    ? template.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match))
    : template;
}

const normalizedPhrase = (text: string) => text.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
const phraseKeys = new Map(Object.entries(supportedMessages.en).map(([key, value]) => [normalizedPhrase(value), key as MessageKey]));
const phraseAliases: Record<string, string> = {
  "your cart": "Cart", "send demo message": "Send", "chat with a booster": "Booster chat",
  "conversation list": "Conversations", "game": "games", "view account details": "View details",
  "open account details": "View details", "account purchase": "Buy Account Now", "show more matches": "Show more",
  "search conversations": "Search", "search accounts": "Search", "search languages": "Search",
};
const phraseMessageAliases: Record<string, MessageKey> = {
  "roles": "coachRoleFilter",
  "browse coaches": "coachBackToList", "queue": "queue", "role": "role",
  "24/7 support": "liveSupport", "terms of service": "terms", "privacy policy": "privacyPolicy",
  "all": "coachAny",
  "sort": "coachSortFilter", "optional": "optional",
  "server": "server", "region": "region", "current rank": "currentRank", "order summary": "orderSummary",
  "resume": "resumeSimulation", "resume demo": "resumeSimulation", "pause": "pauseSimulation", "pause demo": "pauseSimulation",
  "your booster": "assignedPro", "win rate": "winRate",
};
export function translateText(language: LanguageCode, english: string, vietnamese?: string, params?: Record<string, string | number>): string {
  const phrase = normalizedPhrase(english);
  const key = phraseKeys.get(phrase) ?? phraseMessageAliases[phrase];
  const direct = uiPhrases[language]?.[normalizedPhrase(phraseAliases[phrase] ?? english)] ?? commercePhrases[language]?.[phrase];
  const template = language === "vi" && vietnamese ? vietnamese : direct ?? generatedUiPhrases[language]?.[phrase] ?? (key ? translate(language, key) : english);
  const spaced = english.endsWith(" ") && !template.endsWith(" ") ? `${template} ` : template;
  return params ? spaced.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match)) : spaced;
}

export function hasPhraseTranslation(language: LanguageCode, english: string, vietnamese?: string): boolean {
  if (language === "en" || (language === "vi" && Boolean(vietnamese))) return true;
  const phrase = normalizedPhrase(english);
  const key = phraseKeys.get(phrase) ?? phraseMessageAliases[phrase];
  return Boolean(uiPhrases[language]?.[normalizedPhrase(phraseAliases[phrase] ?? english)] || commercePhrases[language]?.[phrase] || generatedUiPhrases[language]?.[phrase] || (key && messages[language][key]));
}
