import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { shouldAllowPrerelease, withTrailingSlash } from "./updateState.js";

export const UPDATE_PROVIDER = "github" as const;
export const UPDATE_GITHUB_OWNER = "cosmoaistudio";
export const UPDATE_GITHUB_REPO = "cosmo-business-ai";

export type GitHubReleaseType = "prerelease" | "release";

export type GitHubUpdaterFeed = {
  provider: "github";
  owner: string;
  repo: string;
  private: false;
  releaseType: GitHubReleaseType;
};

export type GenericUpdaterFeed = {
  provider: "generic";
  url: string;
};

export type UpdaterFeedConfig = GitHubUpdaterFeed | GenericUpdaterFeed;

type BundledPublishFile = {
  provider?: string;
  owner?: string;
  repo?: string;
  releaseType?: string;
  private?: boolean;
};

function readBundledPublishFile(): BundledPublishFile {
  try {
    const configPath = fileURLToPath(new URL("./update-server.json", import.meta.url));
    return JSON.parse(readFileSync(configPath, "utf8")) as BundledPublishFile;
  } catch {
    return {};
  }
}

export function resolveReleaseType(version: string): GitHubReleaseType {
  return shouldAllowPrerelease(version) ? "prerelease" : "release";
}

/**
 * Production feed: public GitHub Releases (no token).
 * COSMO_UPDATE_SERVER_URL is a local generic override only — never baked as default.
 */
export function resolveUpdaterFeed(
  env: NodeJS.ProcessEnv = process.env,
  currentVersion?: string
): UpdaterFeedConfig {
  const fromEnv = env.COSMO_UPDATE_SERVER_URL?.trim();
  if (fromEnv) {
    return { provider: "generic", url: withTrailingSlash(fromEnv) };
  }

  const bundled = readBundledPublishFile();
  const owner = bundled.owner?.trim() || UPDATE_GITHUB_OWNER;
  const repo = bundled.repo?.trim() || UPDATE_GITHUB_REPO;
  const releaseType =
    bundled.releaseType === "release" || bundled.releaseType === "prerelease"
      ? bundled.releaseType
      : resolveReleaseType(currentVersion ?? "1.0.0-rc.1");

  return {
    provider: "github",
    owner,
    repo,
    private: false,
    releaseType,
  };
}

/** Options passed to electron-updater. Never includes token/secret. */
export function toAutoUpdaterFeed(config: UpdaterFeedConfig) {
  if (config.provider === "generic") {
    return {
      provider: "generic" as const,
      url: config.url,
    };
  }

  return {
    provider: "github" as const,
    owner: config.owner,
    repo: config.repo,
    private: false as const,
    vPrefixedTagName: true as const,
  };
}

export function formatFeedLabel(config: UpdaterFeedConfig): string {
  if (config.provider === "generic") return config.url;
  return `https://github.com/${config.owner}/${config.repo}/releases`;
}

export function feedConfigHasClientSecret(
  config: Record<string, unknown> | UpdaterFeedConfig
): boolean {
  return Object.keys(config).some((key) =>
    /token|secret|password|authorization|credential/i.test(key)
  );
}

/** Display/debug label. Not a generic download URL. */
export function resolveRuntimeFeedUrl(
  env: NodeJS.ProcessEnv = process.env,
  currentVersion?: string
): string {
  return formatFeedLabel(resolveUpdaterFeed(env, currentVersion));
}

export function resolveAllowPrerelease(currentVersion: string): boolean {
  return shouldAllowPrerelease(currentVersion);
}

/** First check after the app is already usable (does not block boot/OAuth). */
export const UPDATE_INITIAL_DELAY_MS = 20_000;

/** Recurring background check. */
export const UPDATE_POLL_INTERVAL_MS = 6 * 60 * 60 * 1000;
