// Vitest transforms JSX with the classic runtime, so React must be in scope.
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MenuNicheSelector from "@/features/digital-ordering/menu/admin/MenuNicheSelector";
import MenuThemeEditor from "@/features/digital-ordering/menu/admin/MenuThemeEditor";
import { listNiches } from "@/features/digital-ordering/menu/config/nicheConfig";
import { resolveMenuTheme } from "@/features/digital-ordering/menu/theme/menuTheme";
import { getNicheConfig } from "@/features/digital-ordering/menu/config/nicheConfig";
import { resolveMenuCopy } from "@/features/digital-ordering/menu/utils/resolveMenuPresentation";
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

function renderThemeEditor(
  settings: DigitalStoreSettings,
  onChange = vi.fn()
) {
  const config = getNicheConfig(settings.niche);
  const theme = resolveMenuTheme(
    settings.theme,
    config,
    settings.menuTheme
  );
  const copy = resolveMenuCopy(config, settings.menuCopy);

  render(
    <MenuThemeEditor
      settings={settings}
      resolvedTheme={theme}
      resolvedCopy={copy}
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

    const layout = screen.getByRole("radiogroup", {
      name: "Layout dos produtos",
    });
    fireEvent.click(within(layout).getByRole("radio", { name: "Lista" }));

    expect(onChange).toHaveBeenCalledWith({
      menuTheme: { cardRadius: "xl", productLayout: "list" },
    });
  });

  it("shows the value inherited from the niche when there is no override", () => {
    const nicheDefault = getNicheConfig("acai").theme.bannerStyle;
    renderThemeEditor(storeSettings({ menuTheme: {} }));

    if (nicheDefault) {
      const group = screen.getByRole("radiogroup", {
        name: "Estilo do banner",
      });
      const active = within(group)
        .getAllByRole("radio")
        .find((el) => el.getAttribute("aria-checked") === "true");
      expect(active?.textContent).toMatch(/Imagem|Gradiente|Minimalista/i);
    }
  });

  it("stores the promo message and clears it back to null when emptied", () => {
    const { onChange } = renderThemeEditor(
      storeSettings({ bannerMessage: "Frete grátis" })
    );
    const fields = screen.getAllByLabelText(
      "Mensagem promocional do banner (opcional)"
    );

    fireEvent.change(fields[0], { target: { value: "Combo do dia" } });
    expect(onChange).toHaveBeenCalledWith({ bannerMessage: "Combo do dia" });

    fireEvent.change(fields[0], { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith({ bannerMessage: null });
  });

  it("toggles product images", () => {
    const { onChange } = renderThemeEditor(
      storeSettings({ menuTheme: { showProductImages: true } })
    );

    fireEvent.click(screen.getByLabelText("Exibir imagens"));

    expect(onChange).toHaveBeenCalledWith({
      menuTheme: { showProductImages: false },
    });
  });

  it("does not pretend the image toggle can enable a template that forbids images", () => {
    const { onChange } = renderThemeEditor(
      storeSettings({
        niche: "servicos",
        menuTemplateId: "services",
        menuTheme: { showProductImages: true },
        menuFeatures: { showProductImages: true },
      })
    );

    const toggle = screen.getByLabelText("Exibir imagens");
    expect(toggle).toBeDisabled();
    expect(toggle).not.toBeChecked();
    expect(screen.getByText("Este template não permite imagens.")).toBeTruthy();

    fireEvent.click(toggle);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("stores copy override and clears when matching niche default", () => {
    const { onChange } = renderThemeEditor(storeSettings());
    const field = screen.getByLabelText("Rótulo de personalização");

    fireEvent.change(field, { target: { value: "Escolha os adicionais" } });
    expect(onChange).toHaveBeenCalledWith({
      menuCopy: { customizableLabel: "Escolha os adicionais" },
    });
  });

  it("edits the store display name", () => {
    const { onChange } = renderThemeEditor(storeSettings());

    fireEvent.change(screen.getByLabelText("Nome da loja"), {
      target: { value: "Cosmo Business" },
    });

    expect(onChange).toHaveBeenCalledWith({
      organizationName: "Cosmo Business",
    });
  });
});

describe("MenuConfigurator", () => {
  it("applies the template starting palette when a template is picked", async () => {
    const { default: MenuConfigurator } = await import(
      "@/features/digital-ordering/menu/admin/MenuConfigurator"
    );
    const { appearanceFromTemplate } = await import(
      "@/features/digital-ordering/menu/templates/resolveMenuTemplate"
    );
    const onChange = vi.fn();

    render(
      <MemoryRouter>
        <MenuConfigurator
          organizationId="org-1"
          settings={storeSettings({ niche: "acai", menuTemplateId: "acai" })}
          onChange={onChange}
          isDirty={false}
          onSave={vi.fn()}
          onPublish={vi.fn()}
          onDiscard={vi.fn()}
        />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Template" }));
    fireEvent.click(screen.getByRole("button", { name: /Usar template Sushi/i }));

    const appearance = appearanceFromTemplate("sushi");
    expect(onChange).toHaveBeenCalledWith({
      menuTemplateId: appearance.templateId,
      niche: appearance.niche,
      theme: appearance.theme,
      menuTheme: appearance.menuTheme,
      menuCopy: appearance.menuCopy,
      menuFeatures: appearance.menuFeatures,
    });
  });
});
