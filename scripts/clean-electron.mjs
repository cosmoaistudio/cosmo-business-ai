/**
 * RC1.8 — Remove Electron pack leftovers that cause EBUSY on Windows.
 * Deletes: release/desktop, release/tmp-electron, any win-unpacked*
 */
import { existsSync, mkdirSync, rmSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseDir = path.join(root, "release");

const errors = [];

/** Windows stubborn-folder delete via robocopy mirror of empty dir. */
function forceRemoveDir(target) {
  if (process.platform !== "win32" || !existsSync(target)) return false;
  const empty = path.join(releaseDir, "_empty_del");
  try {
    mkdirSync(empty, { recursive: true });
    execSync(
      `cmd /c robocopy "${empty}" "${target}" /MIR /R:1 /W:1 /NFL /NDL /NJH /NJS /NC /NS`,
      { stdio: "ignore", windowsHide: true }
    );
    rmSync(target, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
    rmSync(empty, { recursive: true, force: true });
    return !existsSync(target);
  } catch {
    try {
      rmSync(empty, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
    return false;
  }
}

function rmSafe(target) {
  if (!existsSync(target)) return false;
  try {
    rmSync(target, {
      recursive: true,
      force: true,
      maxRetries: 8,
      retryDelay: 300,
    });
    console.log(`removed: ${path.relative(root, target)}`);
    return true;
  } catch (error) {
    if (forceRemoveDir(target)) {
      console.log(`removed (forced): ${path.relative(root, target)}`);
      return true;
    }
    const msg = error instanceof Error ? error.message : String(error);
    errors.push({ target, msg });
    console.error(`LOCKED: ${path.relative(root, target)} — ${msg}`);
    return false;
  }
}

function findWinUnpackedDirs(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of entries) {
    const full = path.join(dir, name);
    let isDir = false;
    try {
      isDir = statSync(full).isDirectory();
    } catch {
      continue;
    }
    if (!isDir) continue;
    if (/win-unpacked/i.test(name)) {
      acc.push(full);
    } else {
      findWinUnpackedDirs(full, acc);
    }
  }
  return acc;
}

let removed = 0;

// tmp first — never leave stale builder dirs
if (rmSafe(path.join(releaseDir, "tmp-electron"))) removed += 1;

for (const dir of findWinUnpackedDirs(releaseDir)) {
  if (rmSafe(dir)) removed += 1;
}

if (rmSafe(path.join(releaseDir, "desktop"))) removed += 1;

// second pass for leftovers
for (const dir of findWinUnpackedDirs(releaseDir)) {
  if (rmSafe(dir)) removed += 1;
}

if (errors.length) {
  console.error("\n✖ clean:electron falhou — arquivos/pastas bloqueados:");
  for (const e of errors) {
    console.error(`  - ${e.target}`);
  }
  console.error(
    [
      "",
      "Feche:",
      "  • Cosmo Business (Setup, Portable ou win-unpacked)",
      "  • Janelas do Explorer abertas em release/desktop",
      "  • Qualquer processo Electron",
      "",
      "Depois rode novamente: npm run clean:electron",
    ].join("\n")
  );
  process.exit(1);
}

console.log(
  removed
    ? `clean:electron OK (${removed} path(s) removed)`
    : "clean:electron OK (nothing to remove)"
);
