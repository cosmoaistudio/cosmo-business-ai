import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  canInstallNow,
  clampPercent,
  createIdleUpdateStatus,
  isOfflineLikeError,
  mapProgress,
  phaseMessage,
  resolveUpdateChannel,
  resolveUpdaterChannelName,
  sanitizeUpdaterUserError,
  shouldAllowPrerelease,
  shouldDeferUpdateCheck,
  updateManifestFileName,
  UPDATER_USER_ERROR_MESSAGE,
  withTrailingSlash,
} from "../../../apps/desktop/electron/src/updater/updateState";
import {
  feedConfigHasClientSecret,
  formatFeedLabel,
  resolveAllowPrerelease,
  resolveReleaseType,
  resolveRuntimeFeedUrl,
  resolveUpdaterFeed,
  toAutoUpdaterFeed,
  UPDATE_GITHUB_OWNER,
  UPDATE_GITHUB_REPO,
  UPDATE_PROVIDER,
} from "../../../apps/desktop/electron/src/updater/updateConfig";
import { sanitizeUpdaterLogMeta } from "../../../apps/desktop/electron/src/updater/updaterLog";
import {
  formatLastCheckedAt,
  updatePhaseLabel,
} from "@/desktop/updater/types";

describe("withTrailingSlash", () => {
  it("normaliza URL local de teste", () => {
    expect(withTrailingSlash("http://127.0.0.1:8787")).toBe(
      "http://127.0.0.1:8787/"
    );
    expect(withTrailingSlash("http://127.0.0.1:8787/")).toBe(
      "http://127.0.0.1:8787/"
    );
  });
});

describe("GitHub provider", () => {
  it("usa github / cosmoaistudio / cosmo-business-ai por padrão", () => {
    const feed = resolveUpdaterFeed({}, "1.0.0-rc.1");
    expect(UPDATE_PROVIDER).toBe("github");
    expect(feed).toEqual({
      provider: "github",
      owner: UPDATE_GITHUB_OWNER,
      repo: UPDATE_GITHUB_REPO,
      private: false,
      releaseType: "prerelease",
    });
    expect(formatFeedLabel(feed)).toBe(
      "https://github.com/cosmoaistudio/cosmo-business-ai/releases"
    );
  });

  it("não coloca token no feed mesmo se GH_TOKEN existir no ambiente", () => {
    const feed = resolveUpdaterFeed(
      {
        GH_TOKEN: "ghp_should_never_reach_client",
        GITHUB_TOKEN: "also_secret",
      },
      "1.0.0-rc.1"
    );
    const autoFeed = toAutoUpdaterFeed(feed);
    expect(feedConfigHasClientSecret(feed)).toBe(false);
    expect(feedConfigHasClientSecret(autoFeed)).toBe(false);
    expect(autoFeed).not.toHaveProperty("token");
    expect(autoFeed).not.toHaveProperty("releaseType");
    expect(JSON.stringify(autoFeed)).not.toContain("ghp_");
    expect(JSON.stringify(autoFeed)).not.toContain("also_secret");
  });

  it("JSON empacotado não aponta para servidor fictício nem token", () => {
    const raw = readFileSync(
      path.resolve(
        "apps/desktop/electron/src/updater/update-server.json"
      ),
      "utf8"
    );
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(parsed.provider).toBe("github");
    expect(parsed.owner).toBe("cosmoaistudio");
    expect(parsed.repo).toBe("cosmo-business-ai");
    expect(parsed).not.toHaveProperty("token");
    expect(raw).not.toContain("updates.cosmo.business.ai");
    expect(raw).not.toMatch(/ghp_|github_pat_|GH_TOKEN/);
  });

  it("override local continua generic, sem misturar com GitHub", () => {
    const feed = resolveUpdaterFeed({
      COSMO_UPDATE_SERVER_URL: "http://127.0.0.1:8787",
    });
    expect(feed).toEqual({
      provider: "generic",
      url: "http://127.0.0.1:8787/",
    });
    expect(toAutoUpdaterFeed(feed)).toEqual({
      provider: "generic",
      url: "http://127.0.0.1:8787/",
    });
    expect(resolveRuntimeFeedUrl({
      COSMO_UPDATE_SERVER_URL: "http://127.0.0.1:8787",
    })).toBe("http://127.0.0.1:8787/");
  });
});

describe("prerelease / versionamento", () => {
  it("rc.1, rc.2 e rc.3 habilitam allowPrerelease; estável não", () => {
    expect(shouldAllowPrerelease("1.0.0-rc.1")).toBe(true);
    expect(shouldAllowPrerelease("1.0.0-rc.2")).toBe(true);
    expect(shouldAllowPrerelease("1.0.0-rc.3")).toBe(true);
    expect(resolveAllowPrerelease("1.0.0-rc.3")).toBe(true);
    expect(resolveUpdateChannel("1.0.0-rc.3")).toBe("prerelease");
    expect(shouldAllowPrerelease("1.0.0")).toBe(false);
    expect(shouldAllowPrerelease("1.0.1")).toBe(false);
    expect(resolveAllowPrerelease("1.0.0")).toBe(false);
    expect(resolveUpdateChannel("1.0.0")).toBe("stable");
  });

  it("releaseType acompanha a linha de versão", () => {
    expect(resolveReleaseType("1.0.0-rc.1")).toBe("prerelease");
    expect(resolveReleaseType("1.0.0-rc.3")).toBe("prerelease");
    expect(resolveReleaseType("1.0.0")).toBe("release");
    expect(resolveReleaseType("1.0.1")).toBe("release");
    expect(resolveReleaseType("1.1.0")).toBe("release");
  });

  it("electron-builder ainda emite rc.yml / latest.yml como asset da Release", () => {
    expect(updateManifestFileName("1.0.0-rc.1")).toBe("rc.yml");
    expect(updateManifestFileName("1.0.0")).toBe("latest.yml");
    expect(updateManifestFileName("1.0.1")).toBe("latest.yml");
  });
});

describe("createIdleUpdateStatus / phaseMessage", () => {
  it("estado idle inicial", () => {
    const status = createIdleUpdateStatus({
      currentVersion: "1.0.0-rc.1",
      packaged: true,
      feedUrl: "https://github.com/cosmoaistudio/cosmo-business-ai/releases",
    });
    expect(status.phase).toBe("idle");
    expect(status.availableVersion).toBeNull();
    expect(status.progress).toBeNull();
    expect(status.error).toBeNull();
    expect(status.installOnQuit).toBe(false);
    expect(status.lastCheckedAt).toBeNull();
    expect(status.provider).toBe("github");
    expect(status.channel).toBe("prerelease");
    expect(phaseMessage("idle")).toBe("");
  });

  it("update disponível vs nenhum update", () => {
    expect(phaseMessage("available", "1.0.0-rc.4")).toBe(
      "Versão 1.0.0-rc.4 está disponível."
    );
    expect(phaseMessage("up-to-date")).toBe(
      "Você está usando a versão mais recente."
    );
    expect(updatePhaseLabel("available")).toBe("Nova atualização disponível");
    expect(updatePhaseLabel("up-to-date")).toBe(
      "Você está usando a versão mais recente."
    );
  });
});

describe("mapProgress / clampPercent", () => {
  it("mapeia progresso real e limita 0–100", () => {
    expect(mapProgress({ percent: 78.4, bytesPerSecond: 102400 }).percent).toBe(
      78
    );
    expect(clampPercent(150)).toBe(100);
    expect(clampPercent(-3)).toBe(0);
    expect(clampPercent(Number.NaN)).toBe(0);
  });
});

describe("isOfflineLikeError", () => {
  it("reconhece falhas de rede sem tratar como erro agressivo", () => {
    expect(isOfflineLikeError("net::ERR_INTERNET_DISCONNECTED")).toBe(true);
    expect(isOfflineLikeError("getaddrinfo ENOTFOUND api.github.com")).toBe(
      true
    );
    expect(isOfflineLikeError("ECONNREFUSED")).toBe(true);
    expect(isOfflineLikeError("sha512 checksum mismatch")).toBe(false);
    expect(isOfflineLikeError("")).toBe(false);
  });
});

describe("sanitizeUpdaterUserError", () => {
  it("oculta 404/releases.atom e headers HTTP na UI", () => {
    expect(
      sanitizeUpdaterUserError(
        '404 method: GET url: https://github.com/cosmoaistudio/cosmo-business-ai/releases.atom'
      )
    ).toBe(UPDATER_USER_ERROR_MESSAGE);
    expect(sanitizeUpdaterUserError("set-cookie: _gh_sess=abc")).toBe(
      UPDATER_USER_ERROR_MESSAGE
    );
  });

  it("preserva mensagens curtas de negócio", () => {
    expect(sanitizeUpdaterUserError("Sem conexão para baixar a atualização.")).toBe(
      "Sem conexão para baixar a atualização."
    );
  });
});

describe("resolveUpdaterChannelName", () => {
  it("usa rc para versões 1.0.0-rc.x", () => {
    expect(resolveUpdaterChannelName("1.0.0-rc.3")).toBe("rc");
    expect(resolveUpdaterChannelName("1.0.0")).toBeNull();
  });
});

describe("shouldDeferUpdateCheck", () => {
  it("não reinicia check com download/instalação em andamento", () => {
    expect(shouldDeferUpdateCheck("idle")).toBe(false);
    expect(shouldDeferUpdateCheck("available")).toBe(false);
    expect(shouldDeferUpdateCheck("up-to-date")).toBe(false);
    expect(shouldDeferUpdateCheck("downloading")).toBe(true);
    expect(shouldDeferUpdateCheck("downloaded")).toBe(true);
    expect(shouldDeferUpdateCheck("installing")).toBe(true);
  });
});

describe("canInstallNow", () => {
  it("bloqueia instalar agora durante operação crítica", () => {
    const blocked = canInstallNow({
      phase: "downloaded",
      criticalOperation: true,
      when: "now",
      criticalReason:
        "Há uma venda em andamento. Finalize ou cancele o carrinho antes de atualizar.",
    });
    expect(blocked).toEqual({
      ok: false,
      reason:
        "Há uma venda em andamento. Finalize ou cancele o carrinho antes de atualizar.",
    });
  });

  it("permite atualizar ao fechar mesmo com operação crítica", () => {
    expect(
      canInstallNow({
        phase: "downloaded",
        criticalOperation: true,
        when: "quit",
      })
    ).toEqual({ ok: true });
  });

  it("permite atualizar agora quando não há operação crítica", () => {
    expect(
      canInstallNow({
        phase: "downloaded",
        criticalOperation: false,
        when: "now",
      })
    ).toEqual({ ok: true });
  });

  it("recusa instalar se o download ainda não terminou", () => {
    const result = canInstallNow({
      phase: "available",
      criticalOperation: false,
      when: "now",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("ainda não foi baixada");
    }
  });
});

describe("painel / lastCheckedAt", () => {
  it("formata última verificação", () => {
    expect(formatLastCheckedAt(null)).toBe("Ainda não verificada");
    expect(formatLastCheckedAt("nao-e-data")).toBe("Ainda não verificada");
    const iso = "2026-08-22T12:00:00.000Z";
    expect(formatLastCheckedAt(iso)).not.toBe("Ainda não verificada");
  });
});

describe("sanitizeUpdaterLogMeta", () => {
  it("não registra token, secret nem password", () => {
    const sanitized = sanitizeUpdaterLogMeta({
      version: "1.0.0-rc.1",
      token: "abc",
      accessToken: "xyz",
      password: "nope",
      secret: "nope",
      GH_TOKEN: "nope",
    });
    expect(sanitized).toEqual({ version: "1.0.0-rc.1" });
  });
});
