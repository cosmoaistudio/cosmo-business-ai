import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pngToIco from "png-to-ico";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const png = path.join(root, "apps/desktop/electron/assets/icon.png");
const ico = path.join(root, "apps/desktop/electron/assets/icon.ico");

const buf = await pngToIco(png);
writeFileSync(ico, buf);
console.log(`Wrote ${ico} (${buf.length} bytes)`);
