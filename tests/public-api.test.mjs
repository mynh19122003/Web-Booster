import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { resolve } from "node:path";
import ts from "typescript";

function load(relative, env = {}) {
  const code = ts.transpileModule(readFileSync(resolve(import.meta.dirname, "..", relative), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} };
  new Function("module", "exports", "process", code)(loadedModule, loadedModule.exports, { env });
  return loadedModule.exports;
}

test("public requests use the API and keep server errors", async () => {
  const original = globalThis.fetch;
  let call;
  globalThis.fetch = async (path, options) => {
    call = { path, options };
    return Response.json({ error: "offline" }, { status: 503 });
  };
  try {
    const { publicRequest } = load("services/public.ts");
    const response = await publicRequest("/api/profile", { method: "GET" });
    assert.equal(response.status, 503);
    assert.equal(call.path, "/api/profile");
    assert.equal(call.options.credentials, "same-origin");
  } finally {
    globalThis.fetch = original;
  }
});

test("demo source cannot be selected", () => {
  assert.equal(load("lib/public-data-source.ts").publicMockMode, false);
  assert.throws(() => load("lib/public-data-source.ts", { NEXT_PUBLIC_PUBLIC_DATA_SOURCE: "mock" }), /Use api/);
});
