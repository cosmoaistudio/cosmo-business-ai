/** Custom protocol for Electron Google OAuth callback (PKCE). */
export const ELECTRON_OAUTH_PROTOCOL = "cosmobusiness";

/** Deep link that delivers the auth code into the Electron app. */
export const ELECTRON_OAUTH_CALLBACK_URL = `${ELECTRON_OAUTH_PROTOCOL}://auth/callback`;

/**
 * Loopback HTTPS-free landing page (served by Electron Main).
 * Browser shows a success message, then opens the deep link.
 * Must be allow-listed in Supabase Redirect URLs.
 */
export const ELECTRON_OAUTH_LANDING_PORT = 47821;
export const ELECTRON_OAUTH_LANDING_PATH = "/auth/desktop-complete";
export const ELECTRON_OAUTH_LANDING_URL = `http://127.0.0.1:${ELECTRON_OAUTH_LANDING_PORT}${ELECTRON_OAUTH_LANDING_PATH}`;

export function isElectronAuthEnvironment(
  win: Pick<Window, "cosmoDesktop" | "location"> | undefined = typeof window !==
  "undefined"
    ? window
    : undefined
): boolean {
  if (!win) return false;
  if (win.cosmoDesktop?.isDesktop) return true;
  return win.location?.protocol === "file:";
}

/**
 * Web: current HTTP(S) origin + path.
 * Electron: loopback success page (never file://). Deep link remains the handoff.
 */
export function getAuthRedirectUrl(
  path = "/",
  win: Pick<Window, "cosmoDesktop" | "location"> | undefined = typeof window !==
  "undefined"
    ? window
    : undefined
): string {
  if (isElectronAuthEnvironment(win)) {
    return ELECTRON_OAUTH_LANDING_URL;
  }

  const origin = win?.location?.origin ?? "";
  if (!origin || origin === "null" || origin.startsWith("file:")) {
    return ELECTRON_OAUTH_LANDING_URL;
  }

  const normalized =
    !path || path === "/"
      ? "/"
      : path.startsWith("/")
        ? path
        : `/${path}`;

  return `${origin}${normalized}`;
}

export function isValidCosmoOAuthCallbackUrl(url: string): boolean {
  if (typeof url !== "string" || !url.trim()) return false;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== `${ELECTRON_OAUTH_PROTOCOL}:`) return false;
    if (parsed.hostname !== "auth") return false;
    const path = parsed.pathname.replace(/\/+$/, "") || "/";
    return path === "/callback";
  } catch {
    return false;
  }
}

export function extractOAuthCodeFromCallbackUrl(url: string): string | null {
  if (!isValidCosmoOAuthCallbackUrl(url)) return null;

  try {
    const code = new URL(url).searchParams.get("code");
    if (!code || !code.trim()) return null;
    return code.trim();
  } catch {
    return null;
  }
}

/** Build deep link from landing-page query (code never logged/rendered by caller). */
export function buildElectronDeepLinkFromOAuthParams(input: {
  code?: string | null;
  state?: string | null;
}): string | null {
  const code = input.code?.trim();
  if (!code) return null;

  let deep = `${ELECTRON_OAUTH_CALLBACK_URL}?code=${encodeURIComponent(code)}`;
  const state = input.state?.trim();
  if (state) {
    deep += `&state=${encodeURIComponent(state)}`;
  }
  return deep;
}

/** Prevents double exchange when Main delivers the same callback twice. */
export function createOAuthCallbackDedupe(ttlMs = 60_000) {
  let lastCode: string | null = null;
  let lastAt = 0;

  return {
    shouldProcess(code: string): boolean {
      const now = Date.now();
      if (lastCode === code && now - lastAt < ttlMs) {
        return false;
      }
      lastCode = code;
      lastAt = now;
      return true;
    },
    reset() {
      lastCode = null;
      lastAt = 0;
    },
  };
}
