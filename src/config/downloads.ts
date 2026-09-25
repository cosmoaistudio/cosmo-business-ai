/**
 * Public Windows installer URLs for the Cosmo Business AI download page.
 *
 * Override with env (Vite public, no secrets):
 *   VITE_COSMO_WINDOWS_SETUP_URL
 *   VITE_COSMO_WINDOWS_PORTABLE_URL
 *
 * Defaults come from the public GitHub Release v1.0.0-rc.3.
 * Only assets that exist on that release are used. Do not embed tokens.
 */

export const DOWNLOAD_VERSION = "1.0.0-rc.3";
export const DOWNLOAD_PLATFORM = "Windows 10/11";

/** Real asset on https://github.com/cosmoaistudio/cosmo-business-ai/releases/tag/v1.0.0-rc.3 */
export const WINDOWS_SETUP_URL =
  "https://github.com/cosmoaistudio/cosmo-business-ai/releases/download/v1.0.0-rc.3/Cosmo.Business.AI.Setup.exe";

/**
 * Cosmo.Business.AI.Portable.exe is not attached to v1.0.0-rc.3.
 * Keep empty until the asset exists or VITE_COSMO_WINDOWS_PORTABLE_URL is set.
 */
export const WINDOWS_PORTABLE_URL = "";

export function resolvePublicDownloadUrl(
  envValue: unknown,
  fallback: string
): string {
  if (typeof envValue !== "string") return fallback;
  const trimmed = envValue.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export const DOWNLOAD_URLS = {
  setup: resolvePublicDownloadUrl(
    import.meta.env.VITE_COSMO_WINDOWS_SETUP_URL,
    WINDOWS_SETUP_URL
  ),
  portable: resolvePublicDownloadUrl(
    import.meta.env.VITE_COSMO_WINDOWS_PORTABLE_URL,
    WINDOWS_PORTABLE_URL
  ),
} as const;

export function hasDownloadUrl(url: string): boolean {
  return url.startsWith("https://") || url.startsWith("http://");
}
