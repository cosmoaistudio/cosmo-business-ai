import React from "react";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import MenuEditorShell from "@/features/digital-ordering/menu/admin/editor/MenuEditorShell";
import MenuPreviewRegion from "@/features/digital-ordering/menu/admin/editor/MenuPreviewRegion";
import { MenuPreviewSelectProvider } from "@/features/digital-ordering/menu/admin/editor/MenuPreviewSelectContext";
import { templateAppearancePatch } from "@/features/digital-ordering/menu/admin/editor/MenuEditorPanels";
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

function renderShell(
  settings: DigitalStoreSettings,
  onChange = vi.fn()
) {
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
        activeTemplateId={settings.menuTemplateId ?? "acai"}
        templateName="Açaí"
        isDirty
        onChange={onChange}
        onSave={vi.fn()}
        onPublish={vi.fn()}
        onDiscard={vi.fn()}
      />
    </MemoryRouter>
  );
  return { onChange };
}

describe("preview real selection", () => {
  it("selects the real component and ignores public-menu context", () => {
    const onSelect = vi.fn();
    render(
      <MenuPreviewSelectProvider
        enabled
        selected={null}
        onSelect={onSelect}
      >
        <MenuPreviewRegion id="banner">
          <p>Banner vivo</p>
        </MenuPreviewRegion>
      </MenuPreviewSelectProvider>
    );

    fireEvent.click(screen.getByRole("group", { name: "Selecionar Banner" }));
    expect(onSelect).toHaveBeenCalledWith("banner");
    expect(screen.getByRole("group", { name: "Selecionar Banner" })).not.toHaveAttribute(
      "aria-selected"
    );
  });

  it("marks the selected preview region with aria-current, not aria-selected", () => {
    render(
      <MenuPreviewSelectProvider
        enabled
        selected="banner"
        onSelect={vi.fn()}
      >
        <MenuPreviewRegion id="banner">
          <p>Banner vivo</p>
        </MenuPreviewRegion>
      </MenuPreviewSelectProvider>
    );

    const region = screen.getByRole("group", { name: "Selecionar Banner" });
    expect(region).toHaveAttribute("aria-current", "true");
    expect(region).not.toHaveAttribute("aria-selected");
  });

  it("is a no-op without preview context", () => {
    render(
      <MenuPreviewRegion id="header">
        <button type="button">Público</button>
      </MenuPreviewRegion>
    );
    expect(
      screen.queryByRole("group", { name: "Selecionar Header" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Público" }));
  });
});

describe("template switching confirmation", () => {
  it("asks before replacing visual customizations", () => {
    const { onChange } = renderShell(
      storeSettings({ menuTheme: { primaryColor: "#ff0000" } })
    );

    fireEvent.click(screen.getByRole("button", { name: "Template" }));
    fireEvent.click(
      screen.getByRole("button", { name: /Usar template Cafeteria/i })
    );

    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.getByRole("alertdialog", { name: /Trocar para Cafeteria/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(onChange).toHaveBeenCalledWith(templateAppearancePatch("cafeteria"));
  }, 10_000);
});

describe("undo history", () => {
  it("restores the previous editor snapshot", () => {
    const onChange = vi.fn();
    const initial = storeSettings();
    const { result } = renderHook(() => useEditorHistory(initial, onChange));

    act(() => {
      result.current.pushAndPatch({
        theme: { ...DEFAULT_DIGITAL_STORE_THEME, primaryColor: "#ff0000" },
      });
    });
    expect(onChange).toHaveBeenLastCalledWith({
      theme: { ...DEFAULT_DIGITAL_STORE_THEME, primaryColor: "#ff0000" },
    });

    act(() => {
      result.current.pushAndPatch({
        theme: { ...DEFAULT_DIGITAL_STORE_THEME, primaryColor: "#00aa00" },
      });
    });

    act(() => {
      expect(result.current.undo()).toBe(true);
    });
    expect(onChange).toHaveBeenLastCalledWith({ theme: initial.theme });

    act(() => {
      fireEvent.keyDown(window, { key: "z", ctrlKey: true });
    });
  });

  it("exposes Desfazer in the editor chrome", () => {
    renderShell(storeSettings());
    expect(screen.getByRole("button", { name: "Desfazer" })).toBeDisabled();
  });
});
