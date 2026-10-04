import { chromium } from "@playwright/test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_BROWSER === "chromium" ? undefined : "msedge",
  args: ["--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage();
  await page.route("http://artifact.local/**", async (route) => {
    const name = new URL(route.request().url()).pathname.slice(1);
    if (["three.module.js", "three.core.js"].includes(name))
      await route.fulfill({
        contentType: "text/javascript",
        body: await readFile(`node_modules/three/build/${name}`, "utf8"),
      });
    else
      await route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Original ASCEND environment baker</title>",
      });
  });
  await page.goto("http://artifact.local/");
  const result = await page.evaluate(async () => {
    const THREE = await import("http://artifact.local/three.module.js");
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#24222b");
    const panels = [
      {
        p: [0, 5, -2],
        r: [Math.PI / 2, 0, 0],
        s: [10, 5, 1],
        c: "#ffe1b7",
        i: 3,
      },
      {
        p: [-5, 0, 2],
        r: [0, Math.PI / 2, 0],
        s: [4, 10, 1],
        c: "#ffffff",
        i: 3,
      },
      {
        p: [5, 1, 0],
        r: [0, -Math.PI / 2, 0],
        s: [2, 8, 1],
        c: "#eea65e",
        i: 4,
      },
    ];
    for (const panel of panels) {
      const color = new THREE.Color(panel.c).multiplyScalar(panel.i);
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
      );
      mesh.position.set(...panel.p);
      mesh.rotation.set(...panel.r);
      mesh.scale.set(...panel.s);
      scene.add(mesh);
    }
    const pmrem = new THREE.PMREMGenerator(renderer);
    const target = pmrem.fromScene(scene, 0, 0.1, 100, { size: 64 });
    const pixels = new Uint16Array(target.width * target.height * 4);
    renderer.readRenderTargetPixels(
      target,
      0,
      0,
      target.width,
      target.height,
      pixels,
    );
    const output = {
      width: target.width,
      height: target.height,
      pixels: Array.from(pixels),
    };
    target.dispose();
    pmrem.dispose();
    renderer.dispose();
    return output;
  });
  await mkdir("public/textures", { recursive: true });
  await writeFile(
    "public/textures/ascend-environment.bin.gz",
    gzipSync(Buffer.from(new Uint16Array(result.pixels).buffer)),
  );
  await writeFile(
    "data/environment.json",
    JSON.stringify({ width: result.width, height: result.height }),
  );
  console.log(`Baked original environment ${result.width}x${result.height}.`);
} finally {
  await browser.close();
}
