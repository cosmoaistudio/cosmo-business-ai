let notified = false;

/**
 * Tell Electron the renderer painted a stable shell (loading/auth).
 * Safe to call multiple times — only the first IPC is sent.
 */
export function notifyDesktopVisualReady(source: string) {
  if (notified) return;
  if (typeof window === "undefined") return;
  const api = window.cosmoDesktop;
  if (!api?.isDesktop || typeof api.notifyVisualReady !== "function") return;

  notified = true;
  console.info(`[Cosmo Renderer] visual-ready (${source})`);
  api.notifyVisualReady();
}
