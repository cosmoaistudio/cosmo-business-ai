import { describe, expect, it } from "vitest";

import {
  DOWNLOAD_PLATFORM,
  DOWNLOAD_URLS,
  DOWNLOAD_VERSION,
  WINDOWS_PORTABLE_URL,
  WINDOWS_SETUP_URL,
  hasDownloadUrl,
  resolvePublicDownloadUrl,
} from "@/config/downloads";

describe("DOWNLOAD_URLS", () => {
  it("centraliza setup e portable em um único objeto", () => {
    expect(Object.keys(DOWNLOAD_URLS).sort()).toEqual(["portable", "setup"]);
    expect(DOWNLOAD_URLS.setup).toBe(
      "https://github.com/cosmoaistudio/cosmo-business-ai/releases/download/v1.0.0-rc.3/Cosmo.Business.AI.Setup.exe"
    );
    expect(DOWNLOAD_URLS.setup).toContain("/v1.0.0-rc.3/Cosmo.Business.AI.Setup.exe");
    expect(DOWNLOAD_URLS.portable).toBe("");
  });

  it("exibe a versão da release real e plataforma Windows 10/11", () => {
    expect(DOWNLOAD_VERSION).toBe("1.0.0-rc.3");
    expect(DOWNLOAD_PLATFORM).toBe("Windows 10/11");
  });

  it("não inventa URL quando o asset Portable não existe na release", () => {
    expect(WINDOWS_PORTABLE_URL).toBe("");
    expect(resolvePublicDownloadUrl("", WINDOWS_PORTABLE_URL)).toBe("");
    expect(hasDownloadUrl(WINDOWS_PORTABLE_URL)).toBe(false);
    expect(hasDownloadUrl(WINDOWS_SETUP_URL)).toBe(true);
  });

  it("prioriza URL pública configurada na env", () => {
    const custom =
      "https://github.com/example/releases/download/v1.0.0/Cosmo.Business.AI.Setup.exe";
    expect(resolvePublicDownloadUrl(custom, WINDOWS_SETUP_URL)).toBe(custom);
  });
});
