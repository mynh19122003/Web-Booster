import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(
  new URL("../utils/cropImage.ts", import.meta.url),
  "utf8",
);
const testModule = { exports: {} };
new Function(
  "module",
  "exports",
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText,
)(testModule, testModule.exports);
const { cropImage } = testModule.exports;

test("crop export maps natural pixels, caps resolution and produces an uploadable JPEG", async () => {
  const previousImage = globalThis.Image,
    previousDocument = globalThis.document;
  let drawn, quality, format;
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({
      fillRect() {},
      drawImage(...args) {
        drawn = args;
      },
    }),
    toBlob(callback, type, value) {
      format = type;
      quality = value;
      callback(new Blob(["image-data"], { type }));
    },
  };
  globalThis.Image = class {
    naturalWidth = 1600;
    naturalHeight = 1200;
    async decode() {}
  };
  globalThis.document = { createElement: () => canvas };
  try {
    const file = await cropImage("blob:test", {
      x: 200,
      y: 100,
      width: 800,
      height: 800,
    });
    assert.equal(canvas.width, 512);
    assert.equal(canvas.height, 512);
    assert.deepEqual(drawn.slice(1), [200, 100, 800, 800, 0, 0, 512, 512]);
    assert.equal(format, "image/jpeg");
    assert.equal(quality, 0.92);
    assert.ok(file instanceof File);
    assert.equal(file.name, "avatar.jpg");
    assert.equal(file.type, "image/jpeg");
    await assert.rejects(
      cropImage("blob:test", { x: -1, y: 0, width: 20, height: 20 }),
      /Invalid crop/,
    );
    await assert.rejects(
      cropImage("blob:test", { x: 0, y: 0, width: NaN, height: 20 }),
      /Invalid crop/,
    );
    await assert.rejects(
      cropImage("blob:test", { x: 1500, y: 0, width: 200, height: 200 }),
      /bounds/,
    );
    globalThis.Image = class {
      async decode() {
        throw new Error("bad image");
      }
    };
    await assert.rejects(
      cropImage("blob:broken", { x: 0, y: 0, width: 20, height: 20 }),
      /bad image/,
    );
  } finally {
    globalThis.Image = previousImage;
    globalThis.document = previousDocument;
  }
});
