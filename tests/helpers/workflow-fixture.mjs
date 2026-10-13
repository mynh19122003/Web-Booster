import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
export function workflowFixture() {
  const root = resolve(import.meta.dirname, "../..");
  const cache = new Map();
  function load(path) {
    if (cache.has(path)) return cache.get(path).exports;
    const module = { exports: {} }; cache.set(path, module);
    const require = createRequire(path);
    const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    new Function("require", "module", "exports", code)(id => id.endsWith(".json") ? require(id.startsWith("@/") ? resolve(root, id.slice(2)) : id) : id.startsWith("@/") ? load(resolve(root, `${id.slice(2)}.ts`)) : id.startsWith(".") ? load(resolve(path, "..", `${id}.ts`)) : require(id), module, module.exports);
    return module.exports;
  }
  return load(resolve(root, "mocks/workflow.ts")).workflowFixtures();
}
