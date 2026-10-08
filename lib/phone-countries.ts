import { languages } from "./i18n";

// ITU international calling codes for the countries represented by our locales.
const callingCodes: Record<string, string> = {
  gb: "44", de: "49", fr: "33", es: "34", pt: "351", it: "39", nl: "31",
  jp: "81", ru: "7", pl: "48", se: "46", ro: "40", cz: "420", no: "47",
  dk: "45", fi: "358", bg: "359", hu: "36", hr: "385", ae: "971", tr: "90",
  cn: "86", vn: "84", kr: "82", us: "1", ca: "1", au: "61", sg: "65", gr: "30",
};

export const phoneCountries = Object.entries(callingCodes).map(([code, dial]) => ({ code, dial }));
export function phoneCountryForLanguage(language: string) {
  return languages.find((item) => item.code === language)?.flagCode ?? "gb";
}

export function internationalPhone(country: string, national: string) {
  let digits = national.replace(/\D/g, "");
  // These countries use a domestic trunk zero, omitted after the country code.
  if (["gb", "de", "fr", "pt", "nl", "jp", "se", "ro", "cz", "fi", "hr", "ae", "tr", "vn", "kr", "au"].includes(country)) {
    digits = digits.replace(/^0/, "");
  }
  return digits ? `+${callingCodes[country]}${digits}` : "";
}
