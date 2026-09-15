import { describe, expect, it } from "vitest";
import {
  ELECTRON_OAUTH_CALLBACK_URL,
  ELECTRON_OAUTH_LANDING_URL,
  ELECTRON_OAUTH_PROTOCOL,
  buildElectronDeepLinkFromOAuthParams,
  createOAuthCallbackDedupe,
  extractOAuthCodeFromCallbackUrl,
  getAuthRedirectUrl,
  isElectronAuthEnvironment,
  isValidCosmoOAuthCallbackUrl,
} from "@/features/auth/oauth/oauthRedirect";

function fakeWindow(partial: {
  isDesktop?: boolean;
  protocol?: string;
  origin?: string;
}): Pick<Window, "cosmoDesktop" | "location"> {
  return {
    cosmoDesktop: partial.isDesktop
      ? ({ isDesktop: true } as Window["cosmoDesktop"])
      : undefined,
    location: {
      protocol: partial.protocol ?? "https:",
      origin: partial.origin ?? "https://app.example.com",
    } as Location,
  };
}

describe("OAuth redirect helpers", () => {
  it("detecta Electron via cosmoDesktop", () => {
    expect(isElectronAuthEnvironment(fakeWindow({ isDesktop: true }))).toBe(
      true
    );
  });

  it("detecta Electron via file:", () => {
    expect(
      isElectronAuthEnvironment(
        fakeWindow({ protocol: "file:", origin: "null" })
      )
    ).toBe(true);
  });

  it("não detecta navegador HTTP(S) comum", () => {
    expect(
      isElectronAuthEnvironment(
        fakeWindow({
          protocol: "http:",
          origin: "http://localhost:5173",
        })
      )
    ).toBe(false);
  });

  it("URL web de redirect usa origin HTTP(S)", () => {
    expect(
      getAuthRedirectUrl(
        "/",
        fakeWindow({
          protocol: "http:",
          origin: "http://localhost:5173",
        })
      )
    ).toBe("http://localhost:5173/");

    expect(
      getAuthRedirectUrl(
        "/login",
        fakeWindow({
          protocol: "https:",
          origin: "https://app.example.com",
        })
      )
    ).toBe("https://app.example.com/login");
  });

  it("Electron redirectTo usa landing loopback (nunca file://)", () => {
    expect(getAuthRedirectUrl("/", fakeWindow({ isDesktop: true }))).toBe(
      ELECTRON_OAUTH_LANDING_URL
    );

    expect(
      getAuthRedirectUrl(
        "/",
        fakeWindow({ protocol: "file:", origin: "null" })
      )
    ).toBe(ELECTRON_OAUTH_LANDING_URL);

    expect(ELECTRON_OAUTH_LANDING_URL.startsWith("http://127.0.0.1:")).toBe(
      true
    );
    expect(ELECTRON_OAUTH_CALLBACK_URL.startsWith("file:")).toBe(false);
    expect(ELECTRON_OAUTH_PROTOCOL).toBe("cosmobusiness");
  });

  it("monta deep link a partir do code sem expor na UI", () => {
    expect(
      buildElectronDeepLinkFromOAuthParams({ code: "abc", state: "st" })
    ).toBe(`${ELECTRON_OAUTH_CALLBACK_URL}?code=abc&state=st`);
    expect(buildElectronDeepLinkFromOAuthParams({ code: null })).toBeNull();
  });

  it("aceita callback válido com code", () => {
    const url = `${ELECTRON_OAUTH_CALLBACK_URL}?code=abc123&state=xyz`;
    expect(isValidCosmoOAuthCallbackUrl(url)).toBe(true);
    expect(extractOAuthCodeFromCallbackUrl(url)).toBe("abc123");
  });

  it("rejeita callback sem code", () => {
    const url = `${ELECTRON_OAUTH_CALLBACK_URL}?state=xyz`;
    expect(isValidCosmoOAuthCallbackUrl(url)).toBe(true);
    expect(extractOAuthCodeFromCallbackUrl(url)).toBeNull();
  });

  it("não aceita protocolo diferente", () => {
    expect(
      isValidCosmoOAuthCallbackUrl("https://evil.example/auth/callback?code=1")
    ).toBe(false);
    expect(
      isValidCosmoOAuthCallbackUrl("cosmo://auth/callback?code=1")
    ).toBe(false);
    expect(extractOAuthCodeFromCallbackUrl("https://x/?code=1")).toBeNull();
  });

  it("dedupe ignora callback duplicado com o mesmo code", () => {
    const dedupe = createOAuthCallbackDedupe(60_000);
    expect(dedupe.shouldProcess("code-1")).toBe(true);
    expect(dedupe.shouldProcess("code-1")).toBe(false);
    expect(dedupe.shouldProcess("code-2")).toBe(true);
  });
});
