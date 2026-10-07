import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = process.cwd();
const catalogDir = path.join(root, "lib/i18n/catalog");
const localeDir = path.join(catalogDir, "locales");
const areas = ["auth", "coaches", "common", "dialogs", "home", "layout", "pages", "rank", "regions", "services", "support"];
const locales = ["de", "fr", "es", "pt", "it", "nl", "ja", "ru", "pl", "sv", "ro", "cs", "no", "da", "fi", "bg", "hu", "hr", "ar", "tr"];
const targetCodes = { no: "no", zh: "zh-CN", pt: "pt", ar: "ar" };
const existingLocaleModules = new Map();

function stringValue(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return undefined;
}

function unwrap(node) {
  let value = node;
  while (ts.isAsExpression(value) || ts.isTypeAssertionExpression(value) || ts.isParenthesizedExpression(value) || ts.isSatisfiesExpression(value)) value = value.expression;
  return value;
}

function dataValue(node) {
  const value = unwrap(node);
  if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) return value.text;
  if (ts.isNumericLiteral(value)) return Number(value.text);
  if (value.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (value.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(value)) return value.elements.map(dataValue);
  if (ts.isObjectLiteralExpression(value)) {
    return Object.fromEntries(value.properties.flatMap((property) => {
      if (!ts.isPropertyAssignment(property)) return [];
      const key = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) ? property.name.text : undefined;
      return key ? [[key, dataValue(property.initializer)]] : [];
    }));
  }
  return undefined;
}

async function readVariable(filePath, variableName) {
  const source = ts.createSourceFile(path.basename(filePath), await fs.readFile(filePath, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const declaration = statement.declarationList.declarations.find((item) => ts.isIdentifier(item.name) && item.name.text === variableName);
    if (declaration?.initializer) return dataValue(declaration.initializer);
  }
  throw new Error(`Could not read ${variableName} from ${filePath}`);
}

function objectProperty(node, key) {
  return node.properties.find((property) =>
    ts.isPropertyAssignment(property) &&
    ((ts.isIdentifier(property.name) && property.name.text === key) ||
      (ts.isStringLiteral(property.name) && property.name.text === key)),
  )?.initializer;
}

function exportedObject(sourceText, exportName, locale) {
  const source = ts.createSourceFile("catalog.ts", sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const declaration = statement.declarationList.declarations.find((item) => ts.isIdentifier(item.name) && item.name.text === exportName);
    if (!declaration || !declaration.initializer) continue;
    let initializer = declaration.initializer;
    while (ts.isAsExpression(initializer) || ts.isTypeAssertionExpression(initializer) || ts.isParenthesizedExpression(initializer)) initializer = initializer.expression;
    if (!ts.isObjectLiteralExpression(initializer)) continue;
    const localized = locale === "__flat__" ? initializer : objectProperty(initializer, locale);
    if (!localized || !ts.isObjectLiteralExpression(localized)) return {};
    return Object.fromEntries(localized.properties.flatMap((property) => {
      if (!ts.isPropertyAssignment(property)) return [];
      const key = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) ? property.name.text : undefined;
      const value = stringValue(property.initializer);
      return key && value !== undefined ? [[key, value]] : [];
    }));
  }
  return {};
}

async function readCatalog(locale) {
  const result = {};
  for (const area of areas) {
    Object.assign(result, await readCatalogArea(area, locale));
  }
  return result;
}

async function readCatalogArea(area, locale) {
  const file = path.join(catalogDir, `${area}.ts`);
  const source = await fs.readFile(file, "utf8");
  return exportedObject(source, `${area}Messages`, locale);
}

async function readLocaleModule(locale) {
  const file = path.join(localeDir, `${locale}.ts`);
  try {
    const flat = exportedObject(await fs.readFile(file, "utf8"), `${locale}Messages`, "__flat__");
    if (Object.keys(flat).length) return flat;
  } catch { /* try area-specific catalogs below */ }
  const merged = {};
  for (const area of areas) {
    try {
      const areaFile = path.join(localeDir, locale, `${area}.ts`);
      const areaText = await fs.readFile(areaFile, "utf8");
      Object.assign(merged, exportedObject(areaText, `${locale}${area[0].toUpperCase()}${area.slice(1)}Messages`, "__flat__"));
    } catch { /* the area has not been created yet */ }
  }
  return merged;
}

async function writeLocaleAreas(locale, messages) {
  const folder = path.join(localeDir, locale);
  await fs.mkdir(folder, { recursive: true });
  const imports = [];
  const spreads = [];
  for (const area of areas) {
    const englishArea = await readCatalogArea(area, "en");
    const values = Object.fromEntries(Object.keys(englishArea).map((key) => [key, messages[key] ?? englishArea[key]]));
    const exportName = `${locale}${area[0].toUpperCase()}${area.slice(1)}Messages`;
    await fs.writeFile(path.join(folder, `${area}.ts`), `export const ${exportName} = ${JSON.stringify(values, null, 2)} as const;\n`, "utf8");
    imports.push(`import { ${exportName} } from "./${area}";`);
    spreads.push(`  ...${exportName},`);
  }
  const index = `${imports.join("\n")}\n\nexport const ${locale}Messages = {\n${spreads.join("\n")}\n} as const;\n`;
  await fs.writeFile(path.join(folder, "index.ts"), index, "utf8");
  await fs.rm(path.join(localeDir, `${locale}.ts`), { force: true });
}

function protect(text) {
  const placeholders = [];
  const safe = text
    .replace(/\{\{?\s*[^{}]+\s*\}\}?/g, (match) => {
      const token = `__PLACEHOLDER_${placeholders.length}__`;
      placeholders.push([token, match]);
      return token;
    })
    .replace(/\r?\n/g, " __NEWLINE__ ");
  return { safe, restore: (value) => placeholders.reduce((result, [token, original]) => result.replaceAll(token, original), value).replace(/\s*__NEWLINE__\s*/g, "\n").trim() };
}

async function translateBatch(items, target) {
  const protectedItems = items.map(({ value }) => protect(value));
  const q = items.map((_, index) => `__START_${index}__\n${protectedItems[index].safe}\n__END_${index}__`).join("\n");
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "en");
  url.searchParams.set("tl", targetCodes[target] ?? target);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", q);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    let response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(60000) });
    } catch (error) {
      if (attempt === 4) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      continue;
    }
    if (response.status === 429 || response.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      continue;
    }
    if (!response.ok) throw new Error(`Translation request failed (${response.status}) for ${target}`);
    const payload = await response.json();
    const translated = (payload[0] ?? []).map((segment) => segment[0]).join("");
    const aligned = items.map((_, index) => {
      const start = `__START_${index}__`;
      const end = `__END_${index}__`;
      const startAt = translated.indexOf(start);
      const endAt = translated.indexOf(end, startAt + start.length);
      if (startAt < 0 || endAt < 0) return undefined;
      return protectedItems[index].restore(translated.slice(startAt + start.length, endAt));
    });
    if (aligned.every((value) => value !== undefined)) return aligned;

    return Promise.all(items.map(async ({ value }, index) => {
      const singleUrl = new URL(url);
      singleUrl.searchParams.set("q", protectedItems[index].safe);
      for (let retry = 0; retry < 5; retry += 1) {
        const single = await fetch(singleUrl, { signal: AbortSignal.timeout(60000) });
        if (single.status === 429 || single.status >= 500) {
          await new Promise((resolve) => setTimeout(resolve, 1500 * (retry + 1)));
          continue;
        }
        if (!single.ok) throw new Error(`Single-string translation failed (${single.status}) for ${target}`);
        const singlePayload = await single.json();
        return protectedItems[index].restore((singlePayload[0] ?? []).map((segment) => segment[0]).join(""));
      }
      throw new Error(`Single-string translation retries exhausted for ${target}`);
    }));
  }
  throw new Error(`Translation service rate limit persisted for ${target}`);
}

async function main() {
  await fs.mkdir(localeDir, { recursive: true });
  if (process.argv.includes("--content")) {
    await generateContentLocales();
    return;
  }
  if (process.argv.includes("--check-content")) {
    await checkContentLocales();
    return;
  }
  if (process.argv.includes("--repair-content")) {
    await repairContentLocales();
    return;
  }
  const english = await readCatalog("en");
  if (Object.keys(english).length === 0) throw new Error("Could not read the English source catalogs; no locale files were changed.");
  for (const locale of locales) existingLocaleModules.set(locale, await readLocaleModule(locale));

  if (process.argv.includes("--check")) {
    let issues = 0;
    console.log(`English catalog contains ${Object.keys(english).length} entries.`);
    for (const locale of locales) {
      const messages = existingLocaleModules.get(locale);
      const missing = Object.keys(english).filter((key) => !messages[key]);
      const placeholderMismatches = Object.entries(english).filter(([key, value]) => {
        const expected = [...value.matchAll(/\{\w+\}/g)].map(([match]) => match).sort().join("|");
        const actual = [...(messages[key] ?? "").matchAll(/\{\w+\}/g)].map(([match]) => match).sort().join("|");
        return expected !== actual;
      }).map(([key]) => key);
      console.log(`${locale}: ${Object.keys(messages).length}/${Object.keys(english).length}; missing ${missing.length}; placeholder mismatches ${placeholderMismatches.length}${placeholderMismatches.length ? ` (${placeholderMismatches.join(", ")})` : ""}`);
      issues += missing.length + placeholderMismatches.length;
    }
    if (issues) process.exitCode = 1;
    return;
  }
  if (process.argv.includes("--organize")) {
    for (const locale of locales) {
      await writeLocaleAreas(locale, existingLocaleModules.get(locale));
      console.log(`${locale}: split into ${areas.length} area catalogs`);
    }
    return;
  }

  for (let start = 0; start < locales.length; start += 3) {
    await Promise.all(locales.slice(start, start + 3).map(async (locale) => {
      const current = existingLocaleModules.get(locale);
      const progressPath = path.join(localeDir, `.${locale}.progress.json`);
      let savedProgress = {};
      try { savedProgress = JSON.parse(await fs.readFile(progressPath, "utf8")); } catch { /* no saved batch yet */ }
      const missing = Object.entries(english).filter(([key]) => !current[key]);
      const completed = { ...current, ...savedProgress };
      const pending = missing.filter(([key]) => !completed[key]);
      const batchSize = locale === "ja" ? 4 : ["ro", "ar"].includes(locale) ? 8 : 12;
      for (let offset = 0; offset < pending.length; offset += batchSize) {
        const batch = pending.slice(offset, offset + batchSize).map(([key, value]) => ({ key, value }));
        const translations = await translateBatch(batch, locale);
        batch.forEach(({ key }, index) => { completed[key] = translations[index]; });
        await fs.writeFile(progressPath, JSON.stringify(completed), "utf8");
        if (offset % 48 === 0) console.log(`${locale}: ${Math.min(offset + batch.length, pending.length)}/${pending.length}`);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      await writeLocaleAreas(locale, { ...english, ...completed });
      await fs.rm(progressPath, { force: true });
      console.log(`${locale}: wrote ${Object.keys(english).length} catalog entries`);
    }));
  }
}

async function generateContentLocales() {
  const pages = await readVariable(path.join(root, "data/page-copy.ts"), "english");
  const services = await readVariable(path.join(root, "data/services.ts"), "services");
  const faqs = await readVariable(path.join(root, "data/faqs.ts"), "faqs");
  const reviews = await readVariable(path.join(root, "data/reviews.ts"), "reviews");
  const source = [];
  for (const [page, fields] of Object.entries(pages)) for (const [field, value] of Object.entries(fields)) source.push({ key: `page_${page}_${field}`, value });
  for (const service of services) {
    source.push({ key: `service_${service.slug}_name`, value: service.name });
    source.push({ key: `service_${service.slug}_description`, value: service.description });
  }
  faqs.forEach((faq, index) => {
    source.push({ key: `faq_${index + 1}_question`, value: faq.q });
    source.push({ key: `faq_${index + 1}_answer`, value: faq.a });
  });
  reviews.forEach((review, index) => source.push({ key: `review_${String(index + 1).padStart(2, "0")}`, value: review.text }));

  const contentDir = path.join(root, "data/locales");
  await fs.mkdir(contentDir, { recursive: true });
  for (let start = 0; start < locales.length; start += 3) {
    await Promise.all(locales.slice(start, start + 3).map(async (locale) => {
      const progressPath = path.join(contentDir, `.${locale}.progress.json`);
      let complete = {};
      try { complete = JSON.parse(await fs.readFile(progressPath, "utf8")); } catch { /* no saved batch yet */ }
      for (let offset = 0; offset < source.length; offset += 12) {
        const batch = source.slice(offset, offset + 12).filter(({ key }) => !complete[key]);
        if (!batch.length) continue;
        const translations = await translateBatch(batch, locale);
        batch.forEach(({ key }, index) => { complete[key] = translations[index]; });
        await fs.writeFile(progressPath, JSON.stringify(complete), "utf8");
        if (offset % 48 === 0) console.log(`${locale} content: ${Object.keys(complete).length}/${source.length}`);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      const translatedPages = Object.fromEntries(Object.entries(pages).map(([page, fields]) => [page, Object.fromEntries(Object.keys(fields).map((field) => [field, complete[`page_${page}_${field}`]]))]));
      const translatedServices = Object.fromEntries(services.map((service) => [service.slug, { name: complete[`service_${service.slug}_name`], description: complete[`service_${service.slug}_description`] }]));
      const translatedFaqs = faqs.map((_, index) => ({ q: complete[`faq_${index + 1}_question`], a: complete[`faq_${index + 1}_answer`] }));
      const translatedReviews = Object.fromEntries(reviews.map((_, index) => [`review${String(index + 1).padStart(2, "0")}`, complete[`review_${String(index + 1).padStart(2, "0")}`]]));
      const localeExport = `${locale}Content`;
      const text = `export const ${localeExport} = ${JSON.stringify({ pages: translatedPages, services: translatedServices, faqs: translatedFaqs, reviews: translatedReviews }, null, 2)} as const;\n`;
      await fs.writeFile(path.join(contentDir, `${locale}.ts`), text, "utf8");
      await fs.rm(progressPath, { force: true });
      console.log(`${locale}: wrote ${source.length} localized content strings`);
    }));
  }
}

async function checkContentLocales() {
  const pages = await readVariable(path.join(root, "data/page-copy.ts"), "english");
  const services = await readVariable(path.join(root, "data/services.ts"), "services");
  const faqs = await readVariable(path.join(root, "data/faqs.ts"), "faqs");
  const reviews = await readVariable(path.join(root, "data/reviews.ts"), "reviews");
  const english = new Set();
  for (const fields of Object.values(pages)) for (const value of Object.values(fields)) english.add(value);
  for (const service of services) { english.add(service.name); english.add(service.description); }
  for (const faq of faqs) { english.add(faq.q); english.add(faq.a); }
  for (const review of reviews) english.add(review.text);

  let issues = 0;
  for (const locale of locales) {
    const content = await readVariable(path.join(root, `data/locales/${locale}.ts`), `${locale}Content`);
    const entries = [
      ...Object.entries(content.pages).flatMap(([page, fields]) => Object.entries(fields).map(([field, value]) => [`pages.${page}.${field}`, value])),
      ...Object.entries(content.services).flatMap(([service, fields]) => Object.entries(fields).map(([field, value]) => [`services.${service}.${field}`, value])),
      ...content.faqs.flatMap(({ q, a }, index) => [[`faqs.${index + 1}.question`, q], [`faqs.${index + 1}.answer`, a]]),
      ...Object.entries(content.reviews).map(([key, value]) => [`reviews.${key}`, value]),
    ];
    const remaining = entries.filter(([, value]) => english.has(value));
    console.log(`${locale}: ${entries.length} strings; ${remaining.length} exact English fallbacks${remaining.length ? ` (${remaining.map(([key]) => key).join(", ")})` : ""}`);
    issues += remaining.length;
  }
  if (issues) process.exitCode = 1;
}

async function repairContentLocales() {
  const pages = await readVariable(path.join(root, "data/page-copy.ts"), "english");
  const services = await readVariable(path.join(root, "data/services.ts"), "services");
  const faqs = await readVariable(path.join(root, "data/faqs.ts"), "faqs");
  const reviews = await readVariable(path.join(root, "data/reviews.ts"), "reviews");
  const source = [];
  for (const [page, fields] of Object.entries(pages)) for (const [field, value] of Object.entries(fields)) source.push({ key: `pages.${page}.${field}`, value });
  for (const service of services) {
    source.push({ key: `services.${service.slug}.name`, value: service.name });
    source.push({ key: `services.${service.slug}.description`, value: service.description });
  }
  faqs.forEach((faq, index) => {
    source.push({ key: `faqs.${index}.q`, value: faq.q });
    source.push({ key: `faqs.${index}.a`, value: faq.a });
  });
  reviews.forEach((review, index) => source.push({ key: `reviews.review${String(index + 1).padStart(2, "0")}`, value: review.text }));

  for (let start = 0; start < locales.length; start += 3) {
    await Promise.all(locales.slice(start, start + 3).map(async (locale) => {
      const file = path.join(root, `data/locales/${locale}.ts`);
      const content = await readVariable(file, `${locale}Content`);
      const stale = source.filter(({ key, value }) => {
        const parts = key.split(".");
        let current = content;
        for (const part of parts) current = current?.[part];
        return current === value;
      });
      for (let offset = 0; offset < stale.length; offset += 6) {
        const batch = stale.slice(offset, offset + 6);
        const translations = await translateBatch(batch, locale);
        batch.forEach(({ key }, index) => {
          const parts = key.split(".");
          let parent = content;
          for (const part of parts.slice(0, -1)) parent = parent[part];
          parent[parts.at(-1)] = translations[index];
        });
      }
      const text = `export const ${locale}Content = ${JSON.stringify(content, null, 2)} as const;\n`;
      await fs.writeFile(file, text, "utf8");
      console.log(`${locale}: repaired ${stale.length} exact English fallbacks`);
    }));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
