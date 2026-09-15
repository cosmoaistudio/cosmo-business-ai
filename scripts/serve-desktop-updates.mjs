/**
 * Local generic update feed for electron-updater tests.
 *
 * Serves only files from release/desktop (or a given folder).
 * Does not publish anything remotely.
 *
 *   npm run serve:desktop-updates
 *   npm run serve:desktop-updates -- D:\path\to\feed
 */
import { createServer } from "node:http";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const feedDir = path.resolve(
  process.argv[2] || path.join(root, "release", "desktop")
);
const port = Number(process.env.COSMO_UPDATE_SERVE_PORT || 8787);

const MIME = {
  ".yml": "text/yaml; charset=utf-8",
  ".yaml": "text/yaml; charset=utf-8",
  ".exe": "application/octet-stream",
  ".blockmap": "application/octet-stream",
  ".json": "application/json; charset=utf-8",
};

function listFeedFiles() {
  if (!existsSync(feedDir)) return [];
  return readdirSync(feedDir).filter((name) => {
    const full = path.join(feedDir, name);
    return statSync(full).isFile();
  });
}

function safeFilePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0] || "/");
  const relative = decoded.replace(/^\/+/, "");
  if (!relative || relative.includes("..") || path.isAbsolute(relative)) {
    return null;
  }
  const full = path.resolve(feedDir, relative);
  const rootWithSep = feedDir.endsWith(path.sep) ? feedDir : `${feedDir}${path.sep}`;
  if (full !== feedDir && !full.startsWith(rootWithSep)) return null;
  return full;
}

if (!existsSync(feedDir)) {
  console.error(`Feed directory not found:\n  ${feedDir}`);
  console.error("Gere artefatos com: npm run pack:desktop");
  process.exit(1);
}

const server = createServer((req, res) => {
  const urlPath = req.url || "/";
  if (urlPath === "/" || urlPath === "/index.html") {
    const files = listFeedFiles();
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(
      [
        "Cosmo Desktop update feed (local)",
        `dir: ${feedDir}`,
        "",
        ...files.map((name) => `  /${name}`),
        "",
      ].join("\n")
    );
    return;
  }

  const full = safeFilePath(urlPath);
  if (!full || !existsSync(full) || !statSync(full).isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found\n");
    return;
  }

  const ext = path.extname(full).toLowerCase();
  const body = readFileSync(full);
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Content-Length": body.length,
    "Cache-Control": "no-store",
  });
  res.end(body);
});

server.listen(port, "127.0.0.1", () => {
  const files = listFeedFiles();
  console.log(`Local update feed: http://127.0.0.1:${port}/`);
  console.log(`Serving: ${feedDir}`);
  if (!files.length) {
    console.warn("Nenhum arquivo no feed. Rode npm run pack:desktop primeiro.");
  } else {
    for (const name of files) console.log(`  - ${name}`);
  }
  console.log("\nApontar o Desktop de teste:");
  console.log(`  COSMO_UPDATE_SERVER_URL=http://127.0.0.1:${port}/`);
});
