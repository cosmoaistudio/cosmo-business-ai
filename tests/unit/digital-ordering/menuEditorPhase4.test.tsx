import React from "react";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import MenuEditorShell from "@/features/digital-ordering/menu/admin/editor/MenuEditorShell";
import MenuPublishBar from "@/features/digital-ordering/menu/admin/editor/MenuPublishBar";
import { useEditorHistory } from "@/features/digital-ordering/menu/admin/editor/useEditorHistory";
import { resolveMenuTheme } from "@/features/digital-ordering/menu/theme/menuTheme";
import { getNicheConfig } from "@/features/digital-ordering/menu/config/nicheConfig";
import {
  resolveMenuCopy,
  resolveMenuFeatures,
} from "@/features/digital-ordering/menu/utils/resolveMenuPresentation";
import type { DigitalStoreSettings } from "@/features/digital-ordering/types/digitalStore.types";
import { DEFAULT_DIGITAL_STORE_THEME } from "@/features/digital-ordering/types/digitalStore.types";

vi.mock("@/features/digital-ordering/hooks/useDigitalMenu", () => ({
  useDigitalMenu: () => ({
    products: [],
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

function storeSettings(
  overrides: Partial<DigitalStoreSettings> = {}
): DigitalStoreSettings {
  return {
    slug: "loja-demo",
    organizationId: "org-1",
    organizationName: "Loja Demo",
    logoUrl: null,
    bannerUrl: null,
    welcomeMessage: "Bem-vindo",
    bannerMessage: null,
    theme: DEFAULT_DIGITAL_STORE_THEME,
    niche: "acai",
    menuTemplateId: "acai",
    menuTheme: {},
    menuCopy: {},
    menuFeatures: {},
    acceptsPickup: true,
    acceptsDelivery: true,
    acceptsDineIn: true,
    minimumOrder: 0,
    deliveryFee: 0,
    averagePrepMinutes: 20,
    publishedAt: null,
    ...overrides,
  };
}

describe("field-level undo", () => {
  it("reverts only the last patched keys", () => {
    const onChange = vi.fn();
    const initial = storeSettings({
      menuCopy: { checkoutLabel: "Finalizar" },
    });
    const { result } = renderHook(() => useEditorHistory(initial, onChange));

    act(() => {
      result.current.pushAndPatch({
        theme: { ...DEFAULT_DIGITAL_STORE_THEME, primaryColor: "#ff0000" },
      });
    });
    act(() => {
      expect(result.current.undo()).toBe(true);
    });
    expect(onChange).toHaveBeenLastCalledWith({ theme: initial.theme });
  });
});

describe("publish summary", () => {
  it("asks for confirmation before publishing", () => {
    const onPublish = vi.fn();
    const settings = storeSettings();
    const config = getNicheConfig(settings.niche);
    const theme = resolveMenuTheme(settings.theme, config, settings.menuTheme);

    render(
      <MemoryRouter>
        <MenuEditorShell
          settings={settings}
          products={[]}
          resolvedTheme={theme}
          resolvedCopy={resolveMenuCopy(config, settings.menuCopy)}
          resolvedFeatures={resolveMenuFeatures(config, settings.menuFeatures)}
          activeTemplateId="acai"
          templateName="Açaí"
          isDirty
          onChange={vi.fn()}
          onSave={vi.fn()}
          onPublish={onPublish}
          onDiscard={vi.fn()}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));
    expect(onPublish).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: /Publicar apresentação/i })
    ).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Publicar" })[1]);
    expect(onPublish).toHaveBeenCalled();
  });
});

describe("publish bar professional states", () => {
  it("shows published, error and offline without fake flows", () => {
    const { rerender } = render(
      <MenuPublishBar
        isDirty={false}
        published
        onSave={vi.fn()}
        onPublish={vi.fn()}
      />
    );
    expect(screen.getByText("Publicado")).toBeInTheDocument();

    rerender(
      <MenuPublishBar
        isDirty={false}
        error="fail"
        onSave={vi.fn()}
        onPublish={vi.fn()}
      />
    );
    expect(screen.getByText("Erro ao salvar")).toBeInTheDocument();

    rerender(
      <MenuPublishBar
        isDirty
        offline
        onSave={vi.fn()}
        onPublish={vi.fn()}
      />
    );
    expect(screen.getByText(/Offline/)).toBeInTheDocument();
  });
});
