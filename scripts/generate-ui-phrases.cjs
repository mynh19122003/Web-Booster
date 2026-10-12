/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS catalog generator. */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
require.extensions[".ts"] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, file);
const { languages, translateText, hasPhraseTranslation } = require("../lib/i18n.ts");
const { generatedUiPhrases } = require("../lib/i18n/generated-ui-phrases.ts");
const phrases = new Map();
const normalize = value => value.trim().toLocaleLowerCase("en").replace(/\s+/g, " ");
function add(en, vi) { if (typeof en === "string" && /[a-zA-Z]{2}/.test(en) && en !== "en-GB") phrases.set(en, vi ?? phrases.get(en)); }
function string(node) { return node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined; }
function scan(file) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  function visit(node) {
    if (ts.isCallExpression(node)) {
      const name = node.expression.getText(source);
      if (name === "translateText") add(string(node.arguments[1]), string(node.arguments[2]));
      if (name === "text") add(string(node.arguments[0]), string(node.arguments[1]));
    }
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === "UiText") {
      const attribute = node.attributes.properties.find(prop => prop.name?.getText(source) === "english");
      add(string(attribute?.initializer?.expression ?? attribute?.initializer));
      const expression = attribute?.initializer?.expression;
      if (expression && ts.isConditionalExpression(expression)) { add(string(expression.whenTrue)); add(string(expression.whenFalse)); }
    }
    if (ts.isObjectLiteralExpression(node)) {
      const props = Object.fromEntries(node.properties.filter(ts.isPropertyAssignment).map(prop => [prop.name.getText(source).replaceAll('"', ''), string(prop.initializer)]));
      if (props.en && props.vi) add(props.en, props.vi);
      if (props.unit && props.unitVi) add(props.unit, props.unitVi);
      if (!props.en && props.vi && ts.isPropertyAssignment(node.parent) && ts.isStringLiteral(node.parent.name)) add(node.parent.name.text, props.vi);
    }
    if (ts.isPropertyAssignment(node) && ["label", "title", "placeholder"].includes(node.name.getText(source)) && string(node.initializer)) add(string(node.initializer));
    if (ts.isArrayLiteralExpression(node) && node.elements.length === 2 && node.elements.every(ts.isStringLiteral) && /[À-ỹ]/.test(node.elements[1].text)) add(node.elements[0].text, node.elements[1].text);
    ts.forEachChild(node, visit);
  }
  visit(source);
}
function walk(directory) { for (const entry of fs.readdirSync(directory, { withFileTypes: true })) { const file = path.join(directory, entry.name); if (entry.isDirectory()) walk(file); else if (/\.tsx?$/.test(file)) scan(file); } }
walk("components"); walk("app"); scan("data/coach-profile.ts");
const output = "lib/i18n/generated-ui-phrases.ts";
function save() {
  const content = "// Machine translated public UI copy; placeholders checked by the generator.\nexport const generatedUiPhrases: Record<string, Record<string, string>> = " + JSON.stringify(generatedUiPhrases, null, 2) + ";\n";
  for (let attempt = 0; attempt < 6; attempt++) {
    try { fs.writeFileSync(output, content); return; } catch (error) { if (attempt === 5) throw error; Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 150); }
  }
}
const tokens = text => [...text.matchAll(/\{\w+\}/g)].map(match => match[0]).sort().join("|");
async function fetchTranslations(batch, language) {
  const url = new URL("https://clients5.google.com/translate_a/t");
  url.search = new URLSearchParams({ client: "dict-chrome-ex", sl: "en", tl: language === "zh" ? "zh-CN" : language });
  const placeholders = [];
  for (const phrase of batch) url.searchParams.append("q", phrase.replace(/\{\w+\}/g, match => { const token = `__900000${placeholders.length}__`; placeholders.push([token, match]); return token; }));
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return batch.map((text, index) => {
        let value = data[index]?.trim();
        for (const [token, original] of placeholders) value = value?.replaceAll(token, original);
        if (!value || tokens(value) !== tokens(text)) throw new Error("Translation placeholders changed");
        return value;
      });
    } catch (error) {
      if (batch.length > 1 && /markers changed|placeholders changed/.test(error.message)) { const middle = Math.ceil(batch.length / 2); return [...await fetchTranslations(batch.slice(0, middle), language), ...await fetchTranslations(batch.slice(middle), language)]; }
      if (attempt === 3) { if (batch.length > 1) { const middle = Math.ceil(batch.length / 2); return [...await fetchTranslations(batch.slice(0, middle), language), ...await fetchTranslations(batch.slice(middle), language)]; } throw error; }
      await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 500));
    }
  }
}
async function generate(language) {
  generatedUiPhrases[language] ??= {};
  const missing = [...phrases].filter(([en, vi]) => !generatedUiPhrases[language][normalize(en)] && translateText(language, en, vi) === en).map(([en]) => en);
  if (language === "vi") for (const [en, vi] of phrases) if (vi) generatedUiPhrases.vi[normalize(en)] = vi;
  for (let index = 0; index < missing.length; index += 18) {
    const batch = missing.slice(index, index + 18);
    const values = await fetchTranslations(batch, language);
    values.forEach((value, at) => { generatedUiPhrases[language][normalize(batch[at])] = value; });
    console.log(`${language}: ${Math.min(index + 18, missing.length)}/${missing.length}`);
  }
  save();
}
async function main() {
  if (process.argv.includes("--check")) {
    const report = languages.filter(({ code }) => code !== "en").map(({ code }) => ({ language: code, missing: [...phrases].filter(([en, vi]) => !hasPhraseTranslation(code, en, vi)).map(([en]) => en) }));
    fs.writeFileSync("docs/ui-translation-audit.json", JSON.stringify({ phraseCount: phrases.size, locales: report }, null, 2));
    for (const item of report) console.log(`${item.language}: ${item.missing.length} missing phrases`);
    if (report.some(item => item.missing.length)) process.exitCode = 1;
    return;
  }
  const queue = languages.filter(({ code }) => code !== "en").map(({ code }) => code);
  await Promise.all(Array.from({ length: 2 }, async () => { while (queue.length) await generate(queue.shift()); }));
  console.log(`Done: ${phrases.size} phrases across ${languages.length - 1} locales.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
