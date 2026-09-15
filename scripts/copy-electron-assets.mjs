import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const assetsSource = path.join(root, "apps/desktop/electron/assets");
const assetsTarget = path.join(root, "apps/desktop/electron/dist/assets");

mkdirSync(assetsTarget, { recursive: true });

const required = ["splash.html", "app-boot.html", "first-run.html", "icon.png"];
const optional = ["icon.ico"];

for (const file of required) {
  const from = path.join(assetsSource, file);
  if (!existsSync(from)) {
    console.error(`Missing required Electron asset: ${from}`);
    process.exit(1);
  }
  copyFileSync(from, path.join(assetsTarget, file));
}

for (const file of optional) {
  const from = path.join(assetsSource, file);
  if (!existsSync(from)) continue;
  copyFileSync(from, path.join(assetsTarget, file));
}

const updaterJsonFrom = path.join(
  root,
  "apps/desktop/electron/src/updater/update-server.json"
);
const updaterJsonToDir = path.join(root, "apps/desktop/electron/dist/updater");
if (!existsSync(updaterJsonFrom)) {
  console.error(`Missing update-server.json: ${updaterJsonFrom}`);
  process.exit(1);
}
mkdirSync(updaterJsonToDir, { recursive: true });
copyFileSync(
  updaterJsonFrom,
  path.join(updaterJsonToDir, "update-server.json")
);

console.log("Electron assets copied.");
