/**
 * Bundles Electron preload scripts as single-file CommonJS (.cjs).
 * Sandboxed preload cannot execute ESM `import` — this is the definitive fix.
 */
import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "apps/desktop/electron/dist/preload");

mkdirSync(outDir, { recursive: true });

const entries = [
  {
    entry: path.join(root, "apps/desktop/electron/src/preload/index.ts"),
    outfile: path.join(outDir, "index.cjs"),
  },
  {
    entry: path.join(root, "apps/desktop/electron/src/preload/firstRunPreload.ts"),
    outfile: path.join(outDir, "firstRunPreload.cjs"),
  },
];

for (const { entry, outfile } of entries) {
  await build({
    entryPoints: [entry],
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node20",
    outfile,
    external: ["electron"],
    sourcemap: true,
    logLevel: "info",
  });
  console.log(`Preload CJS: ${path.relative(root, outfile)}`);
}
