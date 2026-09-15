import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checks = [];

function check(name, ok, detail = "") {
  checks.push({ name, ok: Boolean(ok), detail });
}

const electronSrc = path.join(root, "apps/desktop/electron/src");
check("PrintManager", existsSync(path.join(electronSrc, "hardware/printManager.ts")));
check("ScaleManager", existsSync(path.join(electronSrc, "hardware/scale/scaleManager.ts")));
check("Toledo driver", existsSync(path.join(electronSrc, "hardware/scale/drivers/toledo/index.ts")));
check(
  "Toledo Prt5 protocol",
  existsSync(path.join(electronSrc, "hardware/scale/drivers/toledo/protocol/prt5.ts"))
);
check("First-run wizard HTML", existsSync(path.join(root, "apps/desktop/electron/assets/first-run.html")));
check("Splash", existsSync(path.join(root, "apps/desktop/electron/assets/splash.html")));
check("Icon PNG", existsSync(path.join(root, "apps/desktop/electron/assets/icon.png")));
check(
  "Preload CJS (main)",
  existsSync(path.join(root, "apps/desktop/electron/dist/preload/index.cjs"))
);
check(
  "Preload CJS (first-run)",
  existsSync(path.join(root, "apps/desktop/electron/dist/preload/firstRunPreload.cjs"))
);
check("Hardware UI", existsSync(path.join(root, "src/features/hardware/components/HardwareHubPage.tsx")));
check("Docs RC1", existsSync(path.join(root, "docs/RC1_RELEASE.md")));
check("Docs Printing", existsSync(path.join(root, "docs/PRINTING.md")));
check("Docs Scale", existsSync(path.join(root, "docs/SCALE_MANAGER.md")));
check("Docs Hardware", existsSync(path.join(root, "docs/HARDWARE_SETUP.md")));

const releaseDir = path.join(root, "release/desktop");
if (existsSync(releaseDir)) {
  const files = readdirSync(releaseDir);
  check(
    "Installer artifact",
    files.some((f) => /Setup\.exe$/i.test(f) || /nsis/i.test(f)),
    files.join(", ")
  );
  check(
    "Portable artifact",
    files.some((f) => /Portable\.exe$/i.test(f)),
    files.join(", ")
  );
} else {
  check("Installer artifact", false, "release/desktop ainda não gerado — rode npm run pack:desktop");
  check("Portable artifact", false, "release/desktop ainda não gerado — rode npm run pack:desktop");
}

const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "✔" : "✖"} ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
}

if (failed.length) {
  console.error(`\nRC1 smoke: ${failed.length} pendência(s).`);
  process.exitCode = 1;
} else {
  console.log("\nRC1 smoke: estrutura OK.");
}
