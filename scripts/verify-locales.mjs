import { chromium } from "playwright";

const locales = ["en", "vi", "zh", "ko", "de", "fr", "es", "pt", "it", "nl", "ja", "ru", "pl", "sv", "ro", "cs", "no", "da", "fi", "bg", "hu", "hr", "ar", "tr"];
const intlLocales = { en: "en-GB", vi: "vi-VN", zh: "zh-CN", ko: "ko-KR", de: "de-DE", fr: "fr-FR", es: "es-ES", pt: "pt-PT", it: "it-IT", nl: "nl-NL", ja: "ja-JP", ru: "ru-RU", pl: "pl-PL", sv: "sv-SE", ro: "ro-RO", cs: "cs-CZ", no: "nb-NO", da: "da-DK", fi: "fi-FI", bg: "bg-BG", hu: "hu-HU", hr: "hr-HR", ar: "ar-AE", tr: "tr-TR" };
const base = process.env.REVIEW_URL || "http://localhost:3000";
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}) });
const page = await browser.newPage();
const problems = [];
await page.addInitScript(() => {
  const locale = new URL(window.location.href).searchParams.get("__locale");
  if (locale) window.localStorage.setItem("ascend-language", locale);
});

for (const locale of locales) {
  await page.goto(`${base}/?__locale=${locale}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction((expected) => document.documentElement.lang === expected, intlLocales[locale]);
  await page.waitForTimeout(200);
  const result = await page.evaluate(() => {
    const text = document.body.innerText;
    return {
      lang: document.documentElement.lang,
      gameSelectorEnglish: text.includes("CHOOSE YOUR GAME"),
      trackingEnglish: text.includes("Every match."),
      featuresEnglish: text.includes("Enterprise security, verified elite players"),
      careersEnglish: text.includes("Bring your experience in League of Legends"),
      faqEnglish: text.includes("How does boosting work?"),
      recruitmentFormEnglish: text.includes("Required fields are marked with an asterisk"),
    };
  });
  console.log(`${locale}: ${JSON.stringify(result)}`);
  if (result.lang.length === 0) problems.push(`${locale}: missing html lang`);
  if (locale !== "en" && Object.entries(result).some(([key, value]) => key.endsWith("English") && value)) problems.push(`${locale}: visible English UI fallback`);

  await page.goto(`${base}/games/league-of-legends?__locale=${locale}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction((expected) => document.documentElement.lang === expected, intlLocales[locale]);
  await page.locator(".game-product-nav").waitFor({ state: "visible" });
  const gamePage = await page.evaluate(() => {
    const text = document.body.innerText;
    const productNav = document.querySelector(".game-product-nav");
    return {
      categoryTabsInConfigurator: Boolean(productNav?.closest("#configure")),
      hasCategoryTabs: (productNav?.querySelectorAll('[role="tab"]').length ?? 0) > 0,
      rankDescriptionEnglish: text.includes("Choose your current and target tier"),
    };
  });
  console.log(`${locale} game page: ${JSON.stringify(gamePage)}`);
  if (!gamePage.categoryTabsInConfigurator || !gamePage.hasCategoryTabs) problems.push(`${locale}: product categories are missing from the configurator`);
  if (locale !== "en" && gamePage.rankDescriptionEnglish) problems.push(`${locale}: visible English game page UI fallback`);
}

await page.goto(`${base}/games/league-of-legends?__locale=en`, { waitUntil: "domcontentloaded" });
await page.locator(".game-selector-trigger").click();
await page.locator(".game-selector-menu").waitFor({ state: "visible" });
const dropdown = await page.locator(".game-selector-menu").evaluate((menu) => {
  const rect = menu.getBoundingClientRect();
  const options = [...menu.querySelectorAll("[role=option]")];
  const clippedBy = [];
  for (let ancestor = menu.parentElement; ancestor; ancestor = ancestor.parentElement) {
    const style = getComputedStyle(ancestor);
    if ([style.overflowX, style.overflowY].some((value) => value === "hidden" || value === "clip")) clippedBy.push(ancestor.className || ancestor.tagName);
  }
  return { optionCount: options.length, menuHeight: Math.round(rect.height), clippedBy };
});
console.log(`game selector dropdown: ${JSON.stringify(dropdown)}`);
if (dropdown.optionCount !== 3 || dropdown.clippedBy.length) problems.push("game selector dropdown is clipped or missing options");

await browser.close();
if (problems.length) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
}
