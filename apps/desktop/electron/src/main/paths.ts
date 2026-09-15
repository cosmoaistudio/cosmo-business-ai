import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Sandboxed preload must be single-file CommonJS (.cjs). */
export function resolvePreloadPath(
  name: "index" | "firstRunPreload" = "index"
) {
  const file = name === "index" ? "index.cjs" : "firstRunPreload.cjs";
  return path.join(__dirname, "../preload", file);
}
