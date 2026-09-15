import path from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "electron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getHardwareConfigPath() {
  return path.join(app.getPath("userData"), "hardware-config.json");
}

export function getFirstRunStatePath() {
  return path.join(app.getPath("userData"), "first-run.json");
}

export function getAssetPath(...segments: string[]) {
  return path.join(__dirname, "..", "assets", ...segments);
}
