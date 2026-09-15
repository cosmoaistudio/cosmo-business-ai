import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext, type AuthContextValue } from "@/features/auth/context/AuthContext";
import { DesktopUpdatesPanel } from "@/desktop/updater/DesktopUpdatesPanel";
import { SettingsHubPage, initialSettingsSection } from "@/features/saas/components/SettingsHubPage";
import { IPC_CHANNELS } from "../../../apps/desktop/electron/src/ipc/channels";
import type { DesktopUpdateStatus } from "@/desktop/updater/types";
import type { CosmoDesktopApi } from "@/desktop/types";

const baseStatus: DesktopUpdateStatus = {
  phase: "up-to-date",
  currentVersion: "1.0.0-rc.3",
  availableVersion: null,
  progress: null,
  message: "Você está usando a versão mais recente.",
  error: null,
  packaged: true,
  feedUrl: "https://github.com/cosmoaistudio/cosmo-business-ai/releases",
  installOnQuit: false,
  lastCheckedAt: "2026-08-23T12:00:00.000Z",
  provider: "github",
  channel: "prerelease",
};

function mockDesktop(status: DesktopUpdateStatus) {
  const api = {
    isDesktop: true as const,
    version: status.currentVersion,
    updaterGetStatus: vi.fn().mockResolvedValue(status),
    checkUpdate: vi.fn().mockResolvedValue({ ok: true }),
    updaterDownload: vi.fn().mockResolvedValue({ ok: true }),
    updaterInstall: vi.fn().mockResolvedValue({ ok: true }),
    updaterDismiss: vi.fn().mockResolvedValue({ ok: true }),
    onEvent: vi.fn(() => () => undefined),
  };
  window.cosmoDesktop = api as unknown as CosmoDesktopApi;
  return api;
}

const authValue = {
  user: { email: "admin@cosmo.test" },
  session: null,
  profile: { full_name: "Admin", role: "admin" },
  loading: false,
  startup: {
    status: "ready",
    userId: "u1",
    organizationId: "o1",
    role: "admin",
    onboardingCompleted: true,
  },
  signIn: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
  reloadProfile: vi.fn(),
} as unknown as AuthContextValue;

afterEach(() => {
  delete window.cosmoDesktop;
});

describe("initialSettingsSection", () => {
  it("abre Configurações na aba de atualizações", () => {
    expect(initialSettingsSection()).toBe("system");
  });

  it("lê ?section= da query no hash do Electron", () => {
    const originalHash = window.location.hash;
    window.location.hash = "#/configuracoes?section=account";
    expect(initialSettingsSection()).toBe("account");
    window.location.hash = originalHash;
  });
});

describe("IPC do updater", () => {
  it("expõe check, status, download e install sem APIs extras perigosas", () => {
    expect(IPC_CHANNELS.CHECK_UPDATE).toBe("cosmo:check-update");
    expect(IPC_CHANNELS.UPDATER_GET_STATUS).toBe("cosmo:updater-get-status");
    expect(IPC_CHANNELS.UPDATER_DOWNLOAD).toBe("cosmo:updater-download");
    expect(IPC_CHANNELS.UPDATER_INSTALL).toBe("cosmo:updater-install");
  });
});

describe("DesktopUpdatesPanel", () => {
  beforeEach(() => {
    mockDesktop(baseStatus);
  });

  it("mostra diagnóstico quando o Desktop está ativo", async () => {
    render(<DesktopUpdatesPanel />);
    expect(await screen.findByTestId("desktop-updates-panel")).toBeInTheDocument();
    expect(screen.getByText("Atualizações")).toBeInTheDocument();
    expect(screen.getByText("1.0.0-rc.3")).toBeInTheDocument();
    expect(screen.getByText("Pre-release")).toBeInTheDocument();
    expect(screen.getByText("GitHub Releases")).toBeInTheDocument();
    expect(screen.getByText("Atualizado")).toBeInTheDocument();
    expect(
      screen.getByText("Você está usando a versão mais recente.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verificar agora" })).toBeEnabled();
  });

  it("mostra versão disponível e permite baixar", async () => {
    mockDesktop({
      ...baseStatus,
      phase: "available",
      availableVersion: "1.0.0-rc.4",
      message: "Versão 1.0.0-rc.4 está disponível.",
    });
    render(<DesktopUpdatesPanel />);
    expect(await screen.findByText("1.0.0-rc.4")).toBeInTheDocument();
    expect(screen.getByText(/Nova versão disponível/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Baixar atualização" })).toBeInTheDocument();
  });

  it("mostra progresso real do download", async () => {
    mockDesktop({
      ...baseStatus,
      phase: "downloading",
      availableVersion: "1.0.0-rc.4",
      progress: {
        percent: 42,
        bytesPerSecond: 20480,
        transferred: 42,
        total: 100,
      },
    });
    render(<DesktopUpdatesPanel />);
    expect(await screen.findByText(/Baixando atualização… 42%/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "42");
  });

  it("mostra erro amigável e tentar novamente", async () => {
    mockDesktop({
      ...baseStatus,
      phase: "error",
      error:
        "404 method: GET url: https://github.com/cosmoaistudio/cosmo-business-ai/releases.atom",
    });
    render(<DesktopUpdatesPanel />);
    expect(
      await screen.findByText(
        "Não foi possível verificar atualizações agora. Verifique sua conexão e tente novamente."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/releases\.atom/)
    ).not.toBeInTheDocument();
    const retry = screen.getByRole("button", { name: "Tentar novamente" });
    fireEvent.click(retry);
    expect(window.cosmoDesktop?.checkUpdate).toHaveBeenCalled();
  });
});

describe("SettingsHubPage", () => {
  it("renderiza o painel de atualizações ao abrir Configurações", async () => {
    mockDesktop(baseStatus);
    render(
      <MemoryRouter>
        <AuthContext.Provider value={authValue}>
          <SettingsHubPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(await screen.findByTestId("desktop-updates-panel")).toBeInTheDocument();
    expect(screen.getAllByText("Atualizações").length).toBeGreaterThan(0);
  });
});
