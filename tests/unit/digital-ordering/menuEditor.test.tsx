import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MenuColorField from "@/features/digital-ordering/menu/admin/editor/MenuColorField";
import MenuEditorShell from "@/features/digital-ordering/menu/admin/editor/MenuEditorShell";
import MenuPublishBar from "@/features/digital-ordering/menu/admin/editor/MenuPublishBar";
import MenuUnsavedChanges from "@/features/digital-ordering/menu/admin/editor/MenuUnsavedChanges";
import { templateAppearancePatch } from "@/features/digital-ordering/menu/admin/editor/MenuEditorPanels";
import { matchSafeFont, MENU_SAFE_FONTS } from "@/features/digital-ordering/menu/admin/editor/menuEditor.types";
import { resolveMenuTheme } from "@/features/digital-ordering/menu/theme/menuTheme";
import { getNicheConfig } from "@/features/digital-ordering/menu/config/nicheConfig";
import {
  resolveMenuCopy,
  resolveMenuFeatures,
} from "@/features/digital-ordering/menu/utils/resolveMenuPresentation";
import { appearanceFromTemplate } from "@/features/digital-ordering/menu/templates/resolveMenuTemplate";
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
  overrides: {
    onChange?: ReturnType<typeof vi.fn>;
    isDirty?: boolean;
    onSave?: ReturnType<typeof vi.fn>;
    onDiscard?: ReturnType<typeof vi.fn>;
  } = {}
) {
  const config = getNicheConfig(settings.niche);
  const theme = resolveMenuTheme(settings.theme, config, settings.menuTheme);
  const copy = resolveMenuCopy(config, settings.menuCopy);
  const features = resolveMenuFeatures(config, settings.menuFeatures);
  const onChange = overrides.onChange ?? vi.fn();

  render(
    <MemoryRouter>
      <MenuEditorShell
        settings={settings}
        products={[]}
        resolvedTheme={theme}
        resolvedCopy={copy}
        resolvedFeatures={features}
        activeTemplateId={settings.menuTemplateId ?? "acai"}
        templateName="Açaí"
        isDirty={overrides.isDirty ?? false}
        onChange={onChange}
        onSave={overrides.onSave ?? vi.fn()}
        onPublish={vi.fn()}
        onDiscard={overrides.onDiscard ?? vi.fn()}
      />
    </MemoryRouter>
  );

  return { onChange };
}

describe("menu editor — template selection", () => {
  it("applies appearanceFromTemplate when a card is selected", () => {
    const { onChange } = renderShell(storeSettings());

    fireEvent.click(screen.getByRole("button", { name: "Template" }));
    fireEvent.click(
      screen.getByRole("button", { name: /Usar template Cafeteria/i })
    );

    expect(onChange).toHaveBeenCalledWith(templateAppearancePatch("cafeteria"));
    expect(appearanceFromTemplate("cafeteria").niche).toBe("cafeteria");
  }, 10_000);
});

describe("menu editor — color override", () => {
  it("exposes accessible hex + picker", () => {
    const onChange = vi.fn();
    render(
      <MenuColorField label="Cor principal" value="#112233" onChange={onChange} />
    );

    fireEvent.change(screen.getByLabelText("Cor principal (hexadecimal)"), {
      target: { value: "#abcdef" },
    });
    expect(onChange).toHaveBeenCalledWith("#abcdef");
  });

  it("patches store theme primary from Cores section", () => {
    const { onChange } = renderShell(storeSettings());
    fireEvent.click(screen.getByRole("button", { name: "Cores" }));
    fireEvent.change(screen.getByLabelText("Cor principal"), {
      target: { value: "#ff5500" },
    });
    expect(onChange).toHaveBeenCalledWith({
      theme: { ...DEFAULT_DIGITAL_STORE_THEME, primaryColor: "#ff5500" },
    });
  });
});

describe("menu editor — copy override", () => {
  it("stores copy and can reset to template defaults", () => {
    const { onChange } = renderShell(
      storeSettings({ menuCopy: { catalogTitle: "Cardápio custom" } })
    );

    fireEvent.click(screen.getByRole("button", { name: "Checkout" }));
    fireEvent.change(screen.getByLabelText("Título do checkout"), {
      target: { value: "Fechar pedido" },
    });
    expect(onChange).toHaveBeenCalledWith({
      menuCopy: {
        catalogTitle: "Cardápio custom",
        checkoutLabel: "Fechar pedido",
      },
    });

    window.confirm = vi.fn(() => true);
    fireEvent.click(
      screen.getByRole("button", { name: "Usar texto padrão do template" })
    );
    expect(onChange).toHaveBeenCalledWith({
      menuCopy: appearanceFromTemplate("acai").menuCopy,
    });
  });
});

describe("menu editor — unsaved changes", () => {
  it("shows dirty label and discard opens guard", () => {
    const onDiscard = vi.fn();
    renderShell(storeSettings(), { isDirty: true, onDiscard });

    expect(screen.getByText(/Alterações não publicadas/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Descartar" }));
    const dialog = screen.getByRole("alertdialog", {
      name: "Alterações não salvas",
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Descartar" }));
    expect(onDiscard).toHaveBeenCalled();
  });

  it("MenuUnsavedChanges offers continue / discard / save", () => {
    const onContinue = vi.fn();
    const onDiscard = vi.fn();
    const onSave = vi.fn();
    render(
      <MenuUnsavedChanges
        open
        onContinue={onContinue}
        onDiscard={onDiscard}
        onSave={onSave}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Continuar editando" }));
    expect(onContinue).toHaveBeenCalled();
  });
});

describe("menu editor — publish bar", () => {
  it("disables save when clean and enables when dirty", () => {
    const onSave = vi.fn();
    const { rerender } = render(
      <MenuPublishBar
        isDirty={false}
        onSave={onSave}
        onPublish={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();

    rerender(
      <MenuPublishBar isDirty onSave={onSave} onPublish={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: "Salvar" })).not.toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onSave).toHaveBeenCalled();
  });
});

describe("menu editor — preview + typography fallback", () => {
  it("renders preview chrome with mobile/tablet/desktop and zoom", () => {
    renderShell(storeSettings());
    expect(screen.getByText(/Preview real/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mobile/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tablet/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Desktop/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Aumentar zoom")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Modo do preview" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Visualizar" }).length).toBeGreaterThan(0);
  });

  it("falls back safe fonts to curated list", () => {
    expect(matchSafeFont("totally-unknown")).toBe(MENU_SAFE_FONTS[0].value);
    expect(matchSafeFont(MENU_SAFE_FONTS[1].value)).toBe(MENU_SAFE_FONTS[1].value);
  });

  it("density radios include compact/comfortable/spacious", () => {
    renderShell(storeSettings());
    fireEvent.click(screen.getByRole("button", { name: "Layout" }));
    const density = screen.getByRole("radiogroup", { name: "Densidade" });
    expect(within(density).getByRole("radio", { name: "Compacto" })).toBeInTheDocument();
    expect(within(density).getByRole("radio", { name: "Confortável" })).toBeInTheDocument();
    expect(within(density).getByRole("radio", { name: "Grande" })).toBeInTheDocument();
  });
});

describe("menu editor — reset helper", () => {
  it("templateAppearancePatch mirrors appearanceFromTemplate seeds", () => {
    const appearance = appearanceFromTemplate("burger");
    expect(templateAppearancePatch("burger")).toEqual({
      menuTemplateId: appearance.templateId,
      niche: appearance.niche,
      theme: appearance.theme,
      menuTheme: appearance.menuTheme,
      menuCopy: appearance.menuCopy,
      menuFeatures: appearance.menuFeatures,
    });
  });
});
