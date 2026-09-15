/**
 * RC1.8 — Stable Electron packaging pipeline for Windows.
 *
 * 1) Abort if Cosmo/Electron processes hold locks
 * 2) Clean release/tmp-electron (exclusive pack root)
 * 3) electron-builder → release/tmp-electron/pack-<stamp>/
 * 4) Copy final Setup/Portable → release/desktop/
 *
 * Never packs into release/desktop (avoids EBUSY on win-unpacked.tmp).
 */
import { spawnSync, execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  rmSync,
  readdirSync,
  copyFileSync,
  unlinkSync,
  statSync,
  readFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseDesktop = path.join(root, "release", "desktop");
const tmpRoot = path.join(root, "release", "tmp-electron");
const builderConfig = path.join(
  root,
  "apps/desktop/electron/electron-builder.yml"
);

function fail(message) {
  console.error(`\n✖ pack:desktop aborted\n${message}\n`);
  process.exit(1);
}

function assertNoLockingProcesses() {
  if (process.platform !== "win32") return;

  const scriptPath = path.join(root, "scripts", "check-electron-locks.ps1");
  let found = "";
  try {
    found = execSync(
      `powershell.exe -NoProfile -NonInteractive -File "${scriptPath}"`,
      { encoding: "utf8", windowsHide: true }
    ).trim();
  } catch {
    found = "";
  }

  if (found) {
    fail(
      [
        "Arquivos de release estão provavelmente bloqueados por processos abertos:",
        `  ${found}`,
        "",
        "Feche todas as janelas do Cosmo Business / Electron e tente novamente:",
        "  npm run clean:electron",
        "  npm run pack:desktop",
        "",
        "Causa típica do EBUSY: Cosmo/Electron ainda em execução enquanto",
        "electron-builder tenta renomear win-unpacked.tmp → win-unpacked.",
      ].join("\n")
    );
  }
}

function forceRemoveDir(target) {
  if (!existsSync(target)) return true;
  try {
    rmSync(target, {
      recursive: true,
      force: true,
      maxRetries: 8,
      retryDelay: 300,
    });
    return !existsSync(target);
  } catch {
    /* try robocopy mirror */
  }
  if (process.platform !== "win32") return false;
  const empty = path.join(root, "release", "_empty_del");
  try {
    mkdirSync(empty, { recursive: true });
    execSync(
      `cmd /c robocopy "${empty}" "${target}" /MIR /R:1 /W:1 /NFL /NDL /NJH /NJS /NC /NS`,
      { stdio: "ignore", windowsHide: true }
    );
    rmSync(target, { recursive: true, force: true });
    rmSync(empty, { recursive: true, force: true });
  } catch {
    try {
      rmSync(empty, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
  return !existsSync(target);
}

function rmDirOrFail(dir, label) {
  if (!existsSync(dir)) return;
  if (!forceRemoveDir(dir)) {
    fail(
      [
        `Pasta bloqueada (${label}):`,
        `  ${dir}`,
        "",
        "Feche Cosmo Business / Explorer e rode: npm run clean:electron",
      ].join("\n")
    );
  }
}

function withTrailingSlash(url) {
  return url.endsWith("/") ? url : `${url}/`;
}

function readPublishConfig() {
  const jsonPath = path.join(
    root,
    "apps/desktop/electron/src/updater/update-server.json"
  );
  if (!existsSync(jsonPath)) {
    fail(`Arquivo de feed ausente: ${jsonPath}`);
  }
  return JSON.parse(readFileSync(jsonPath, "utf8"));
}

/**
 * GitHub Releases in production. COSMO_UPDATE_SERVER_URL is a local generic
 * override only. pack:desktop never publishes (see --publish never).
 */
function resolvePublishCli() {
  const fromEnv = process.env.COSMO_UPDATE_SERVER_URL?.trim();
  if (fromEnv) {
    const url = withTrailingSlash(fromEnv);
    return {
      label: `generic ${url} (teste local)`,
      args: [
        "--config.publish.provider",
        "generic",
        `--config.publish.url=${url}`,
        "--publish",
        "never",
      ],
    };
  }

  const parsed = readPublishConfig();
  const owner = String(parsed.owner ?? "cosmoaistudio").trim();
  const repo = String(parsed.repo ?? "cosmo-business-ai").trim();
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
  const version = String(pkg.version ?? "");
  const releaseType = /-[a-z0-9]/i.test(version) ? "prerelease" : "release";

  return {
    label: `github ${owner}/${repo} (${releaseType})`,
    args: [
      "--config.publish.provider",
      "github",
      `--config.publish.owner=${owner}`,
      `--config.publish.repo=${repo}`,
      `--config.publish.releaseType=${releaseType}`,
      "--config.publish.private",
      "false",
      "--publish",
      "never",
    ],
  };
}

function clearPreviousUpdateArtifacts(toDir) {
  if (!existsSync(toDir)) return;
  for (const name of readdirSync(toDir)) {
    if (
      /Setup\.exe(\.exe)?$/i.test(name) ||
      /Portable\.exe$/i.test(name) ||
      /Cosmo\.Business\.AI\.(Setup|Portable)\.exe$/i.test(name) ||
      /\.blockmap$/i.test(name) ||
      /\.yml$/i.test(name) ||
      /\.yaml$/i.test(name)
    ) {
      const full = path.join(toDir, name);
      try {
        unlinkSync(full);
      } catch {
        console.warn(`warn: não foi possível remover artefato antigo ${name}`);
      }
    }
  }
}

function exclusiveOutDir() {
  const stamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
  const rand = Math.random().toString(36).slice(2, 8);
  const out = path.join(tmpRoot, `pack-${stamp}-${rand}`);
  mkdirSync(out, { recursive: true });
  return out;
}

function listFilesRecursive(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) listFilesRecursive(full, acc);
    else acc.push(full);
  }
  return acc;
}

function publishArtifacts(fromDir, toDir) {
  mkdirSync(toDir, { recursive: true });
  clearPreviousUpdateArtifacts(toDir);

  // Best-effort: remove leftover unpacked dirs so they are not reused
  for (const name of readdirSync(toDir)) {
    if (/win-unpacked/i.test(name)) {
      const full = path.join(toDir, name);
      if (!forceRemoveDir(full)) {
        console.warn(
          `warn: não foi possível remover ${path.relative(root, full)} (lock). Continuando — pack não usa essa pasta.`
        );
      }
    }
  }

  const files = readdirSync(fromDir).filter((name) =>
    statSync(path.join(fromDir, name)).isFile()
  );

  const wanted = files.filter(
    (name) =>
      /Setup\.exe$/i.test(name) ||
      /Portable\.exe$/i.test(name) ||
      /\.blockmap$/i.test(name) ||
      ((/\.yml$/i.test(name) || /\.yaml$/i.test(name)) &&
        !/^builder-debug\./i.test(name))
  );

  if (!wanted.some((n) => /Setup\.exe$/i.test(n))) {
    fail(`Setup.exe não foi gerado em ${fromDir}`);
  }
  if (!wanted.some((n) => /Portable\.exe$/i.test(n))) {
    fail(`Portable.exe não foi gerado em ${fromDir}`);
  }

  for (const name of wanted) {
    const src = path.join(fromDir, name);
    const dest = path.join(toDir, name);
    try {
      if (existsSync(dest)) unlinkSync(dest);
      copyFileSync(src, dest);
      console.log(`artifact → release/desktop/${name}`);
    } catch (error) {
      fail(
        [
          `Não foi possível escrever artefato (arquivo bloqueado):`,
          `  ${dest}`,
          `  ${error.message}`,
          "",
          "Feche Cosmo Business / Explorer e rode: npm run clean:electron",
        ].join("\n")
      );
    }
  }
}

// --- pipeline ---
console.log("pack:desktop — checking for locking processes…");
assertNoLockingProcesses();

console.log("pack:desktop — preparing exclusive temp output…");
rmDirOrFail(tmpRoot, "release/tmp-electron");
mkdirSync(tmpRoot, { recursive: true });

const outDir = exclusiveOutDir();
const publishCli = resolvePublishCli();
console.log(
  `pack:desktop — electron-builder output: ${path.relative(root, outDir)}`
);
console.log(`pack:desktop — publish: ${publishCli.label}`);
console.log("pack:desktop — --publish never (não envia à Release do GitHub)");
console.log(
  "pack:desktop — NÃO usa release/desktop nem win-unpacked.tmp reutilizado"
);

const env = {
  ...process.env,
  CSC_IDENTITY_AUTO_DISCOVERY: "false",
};
delete env.GH_TOKEN;
delete env.GITHUB_TOKEN;

const pack = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  [
    "electron-builder",
    "--config",
    builderConfig,
    "--config.directories.output",
    outDir,
    ...publishCli.args,
  ],
  {
    cwd: root,
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
  }
);

if (pack.status !== 0) {
  fail(
    [
      `electron-builder exit ${pack.status}`,
      "",
      "Se o erro foi EBUSY em win-unpacked.tmp/default_app.asar:",
      "  1) Feche Cosmo Business / Electron",
      "  2) npm run clean:electron",
      "  3) npm run pack:desktop",
    ].join("\n")
  );
}

const leftoverTmp = listFilesRecursive(outDir).some((f) =>
  f.includes(`${path.sep}win-unpacked.tmp${path.sep}`)
);
if (leftoverTmp) {
  fail(
    "Pack terminou com win-unpacked.tmp residual no diretório exclusivo (rename incompleto / lock)."
  );
}

console.log("pack:desktop — publishing artifacts to release/desktop…");
mkdirSync(releaseDesktop, { recursive: true });
publishArtifacts(outDir, releaseDesktop);

rmDirOrFail(tmpRoot, "release/tmp-electron (cleanup)");

console.log("\n✔ pack:desktop OK — artefatos em release/desktop/");
console.log(
  "  (pasta temporária exclusiva removida; builder nunca escreveu em release/desktop/win-unpacked*)"
);
