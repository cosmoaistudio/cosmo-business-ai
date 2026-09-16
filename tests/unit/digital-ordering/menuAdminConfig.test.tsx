// Vitest transforms JSX with the classic runtime, so React must be in scope.
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import MenuNicheSelector from "@/features/digital-ordering/menu/admin/MenuNicheSelector";
import MenuThemeEditor from "@/features/digital-ordering/menu/admin/MenuThemeEditor";
import { listNiches } from "@/features/digital-ordering/menu/config/nicheConfig";
import { resolveMenuTheme } from "@/features/digital-ordering/menu/theme/menuTheme";
import { getNicheConfig } from "@/features/digital-ordering/menu/config/nicheConfig";
import type { DigitalStoreSettings } from "@/features/digital-ordering/types/digitalStore.types";
import { DEFAULT_DIGITAL_STORE_THEME } from "@/features/digital-ordering/types/digitalStore.types";

vi.mock("@/features/digital-ordering/hooks/useDigitalMenu", () => ({
  useDigitalMenu: () => ({ products: [], loading: false, error: null, reload: vi.fn() }),
}));

function storeSettings(
  overrides: Partial<DigitalStoreSettings> = {}
): DigitalStoreSettings {
  return {
    slug: "acai-do-ze",
    organizationId: "org-1",
    organizationName: "Açaí do Zé",
    logoUrl: null,
    bannerUrl: null,
    welcomeMessage: "Bem-vindo",
    bannerMessage: null,
    theme: DEFAULT_DIGITAL_STORE_THEME,
    niche: "acai",
    menuTheme: { cardRadius: "xl" },
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

function renderThemeEditor(
  settings: DigitalStoreSettings,
  onChange = vi.fn()
) {
  const theme = resolveMenuTheme(
    settings.theme,
    getNicheConfig(settings.niche),
    settings.menuTheme
  );

  render(
    <MenuThemeEditor
      settings={settings}
      resolvedTheme={theme}
      onChange={onChange}
    />
  );

  return { onChange };
}

describe("MenuNicheSelector", () => {
  it("offers every niche from the registry", () => {
    render(<MenuNicheSelector value="acai" onChange={vi.fn()} />);

    expect(screen.getAllByRole("radio")).toHaveLength(listNiches().length);
  });

  it("labels the generic niche as Outros", () => {
    render(<MenuNicheSelector value="acai" onChange={vi.fn()} />);

    expect(screen.getByLabelText("Outros")).toBeInTheDocument();
  });

  it("marks the current niche as selected", () => {
    render(<MenuNicheSelector value="pizzaria" onChange={vi.fn()} />);

    expect(screen.getByLabelText("Pizzaria")).toBeChecked();
    expect(screen.getByLabelText("Hamburgueria")).not.toBeChecked();
  });

  it("reports the chosen niche", () => {
    const onChange = vi.fn();
    render(<MenuNicheSelector value="acai" onChange={onChange} />);

    fireEvent.click(screen.getByLabelText("Hamburgueria"));

    expect(onChange).toHaveBeenCalledWith("hamburgueria");
  });
});

describe("MenuThemeEditor", () => {
  it("patches a single colour without dropping the others", () => {
    const { onChange } = renderThemeEditor(storeSettings());

    fireEvent.change(screen.getByLabelText("Cor principal"), {
      target: { value: "#ff0000" },
    });

    expect(onChange).toHaveBeenCalledWith({
      theme: { ...DEFAULT_DIGITAL_STORE_THEME, primaryColor: "#ff0000" },
    });
  });

  it("keeps existing menu theme overrides when patching a token", () => {
    const { onChange } = renderThemeEditor(storeSettings());

    fireEvent.change(screen.getByLabelText("Layout dos produtos"), {
      target: { value: "list" },
    });

    expect(onChange).toHaveBeenCalledWith({
      menuTheme: { cardRadius: "xl", productLayout: "list" },
    });
  });

  it("shows the value inherited from the niche when there is no override", () => {
    const nicheDefault = getNicheConfig("acai").theme.bannerStyle;
    renderThemeEditor(storeSettings({ menuTheme: {} }));

    if (nicheDefault) {
      expect(screen.getByLabelText("Estilo do banner")).toHaveValue(
        nicheDefault
      );
    }
  });

  it("stores the promo message and clears it back to null when emptied", () => {
    const { onChange } = renderThemeEditor(
      storeSettings({ bannerMessage: "Frete grátis" })
    );
    const field = screen.getByLabelText(
      "Mensagem promocional do banner (opcional)"
    );

    fireEvent.change(field, { target: { value: "Combo do dia" } });
    expect(onChange).toHaveBeenCalledWith({ bannerMessage: "Combo do dia" });

    fireEvent.change(field, { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith({ bannerMessage: null });
  });

  it("toggles product images", () => {
    const { onChange } = renderThemeEditor(
      storeSettings({ menuTheme: { showProductImages: true } })
    );

    fireEvent.click(screen.getByLabelText("Mostrar imagens dos produtos"));

    expect(onChange).toHaveBeenCalledWith({
      menuTheme: { showProductImages: false },
    });
  });
});

describe("MenuConfigurator", () => {
  it("applies the niche starting palette when a niche is picked", async () => {
    const { default: MenuConfigurator } = await import(
      "@/features/digital-ordering/menu/admin/MenuConfigurator"
    );
    const { appearanceFromNiche } = await import(
      "@/features/digital-ordering/menu/config/nicheConfig"
    );
    const onChange = vi.fn();

    render(
      <MenuConfigurator
        organizationId="org-1"
        settings={storeSettings({ niche: "acai" })}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByLabelText("Pizzaria"));

    const appearance = appearanceFromNiche("pizzaria");
    expect(onChange).toHaveBeenCalledWith({
      niche: "pizzaria",
      theme: appearance.theme,
      menuTheme: appearance.menuTheme,
    });
  });
});
