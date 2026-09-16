import { describe, expect, it } from "vitest";
import {
  DEFAULT_DIGITAL_MENU_NICHE,
  appearanceFromNiche,
  getNicheConfig,
  isDigitalMenuNiche,
  listNiches,
  resolveNiche,
} from "@/features/digital-ordering/menu/config/nicheConfig";
import {
  DEFAULT_MENU_THEME,
  buttonStyleFor,
  menuThemeToCssVars,
  parseMenuThemeOverrides,
  radiusToCss,
  resolveMenuTheme,
} from "@/features/digital-ordering/menu/theme/menuTheme";
import { buildMenuSeo } from "@/features/digital-ordering/menu/core/menuSeo";
import type { DigitalStoreSettings } from "@/features/digital-ordering/types/digitalStore.types";
import { DEFAULT_DIGITAL_STORE_THEME } from "@/features/digital-ordering/types/digitalStore.types";

function storeSettings(
  overrides: Partial<DigitalStoreSettings> = {}
): DigitalStoreSettings {
  return {
    slug: "loja-teste",
    organizationId: "org-1",
    organizationName: "Loja Teste",
    logoUrl: null,
    bannerUrl: null,
    welcomeMessage: "Bem-vindo",
    bannerMessage: null,
    theme: DEFAULT_DIGITAL_STORE_THEME,
    niche: "generic",
    menuTheme: {},
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

describe("niche registry", () => {
  it("exposes every niche with a label", () => {
    const niches = listNiches();

    expect(niches.length).toBeGreaterThanOrEqual(7);
    for (const entry of niches) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });

  it("falls back to the default niche for unknown values", () => {
    expect(resolveNiche("marmitaria-inexistente")).toBe(DEFAULT_DIGITAL_MENU_NICHE);
    expect(resolveNiche(null)).toBe(DEFAULT_DIGITAL_MENU_NICHE);
    expect(resolveNiche(undefined)).toBe(DEFAULT_DIGITAL_MENU_NICHE);
    expect(resolveNiche(42)).toBe(DEFAULT_DIGITAL_MENU_NICHE);
  });

  it("recognises known niches", () => {
    expect(isDigitalMenuNiche("pizzaria")).toBe(true);
    expect(isDigitalMenuNiche("sushi-bar")).toBe(false);
  });

  it("always resolves a complete config regardless of the niche", () => {
    for (const { niche } of listNiches()) {
      const config = getNicheConfig(niche);

      expect(config.niche).toBe(niche);
      expect(config.copy.searchPlaceholder.length).toBeGreaterThan(0);
      expect(config.copy.allCategoryLabel.length).toBeGreaterThan(0);
      expect(config.rules.maxHighlights).toBeGreaterThan(0);
      expect(typeof config.features.showSearch).toBe("boolean");
    }
  });

  it("inherits base copy and overrides only what the niche declares", () => {
    const generic = getNicheConfig("generic");
    const acai = getNicheConfig("acai");

    expect(acai.copy.allCategoryLabel).toBe(generic.copy.allCategoryLabel);
    expect(acai.copy.searchPlaceholder).not.toBe(generic.copy.searchPlaceholder);
  });
});

describe("appearanceFromNiche", () => {
  it("applies the pizzaria palette without touching identity fields", () => {
    const appearance = appearanceFromNiche("pizzaria");
    const config = getNicheConfig("pizzaria");

    expect(appearance.niche).toBe("pizzaria");
    expect(appearance.theme.primaryColor).toBe(config.theme.primaryColor);
    expect(appearance.theme.secondaryColor).toBe(config.theme.secondaryColor);
    expect(appearance.menuTheme.cardRadius).toBe(config.theme.cardRadius);
    expect(appearance).not.toHaveProperty("logoUrl");
    expect(appearance).not.toHaveProperty("bannerMessage");
    expect(appearance).not.toHaveProperty("catalog_snapshot");
  });

  it("falls back to engine colours for the generic niche", () => {
    const appearance = appearanceFromNiche("generic");

    expect(appearance.theme.primaryColor).toBe(DEFAULT_MENU_THEME.primaryColor);
    expect(appearance.menuTheme.productLayout).toBeUndefined();
  });

  it("uses list layout as the starting point for adega", () => {
    expect(appearanceFromNiche("adega").menuTheme.productLayout).toBe("list");
  });
});

describe("resolveMenuTheme", () => {
  it("returns engine defaults with no store and no niche overrides", () => {
    const theme = resolveMenuTheme(null, getNicheConfig("generic"));

    expect(theme).toEqual(DEFAULT_MENU_THEME);
  });

  it("applies niche defaults over engine defaults", () => {
    const theme = resolveMenuTheme(null, getNicheConfig("adega"));

    expect(theme.productLayout).toBe("list");
    expect(theme.density).toBe("compact");
  });

  it("lets store colors win over niche colors", () => {
    const theme = resolveMenuTheme(
      { ...DEFAULT_DIGITAL_STORE_THEME, primaryColor: "#123456" },
      getNicheConfig("acai")
    );

    expect(theme.primaryColor).toBe("#123456");
  });

  it("lets explicit overrides win over everything", () => {
    const theme = resolveMenuTheme(
      { ...DEFAULT_DIGITAL_STORE_THEME, primaryColor: "#123456" },
      getNicheConfig("acai"),
      { primaryColor: "#abcdef", cardRadius: "none" }
    );

    expect(theme.primaryColor).toBe("#abcdef");
    expect(theme.cardRadius).toBe("none");
  });

  it("keeps the legacy four-color store theme working", () => {
    const theme = resolveMenuTheme(
      DEFAULT_DIGITAL_STORE_THEME,
      getNicheConfig("generic")
    );

    expect(theme.primaryColor).toBe(DEFAULT_DIGITAL_STORE_THEME.primaryColor);
    expect(theme.backgroundColor).toBe(DEFAULT_DIGITAL_STORE_THEME.backgroundColor);
  });
});

describe("theme serialization", () => {
  it("exposes css custom properties for the menu subtree", () => {
    const vars = menuThemeToCssVars(DEFAULT_MENU_THEME);

    expect(vars["--menu-primary"]).toBe(DEFAULT_MENU_THEME.primaryColor);
    expect(vars["--menu-card-radius"]).toBe(radiusToCss(DEFAULT_MENU_THEME.cardRadius));
  });

  it("parses persisted overrides and ignores invalid values", () => {
    const overrides = parseMenuThemeOverrides({
      cardRadius: "xl",
      buttonStyle: "outline",
      productLayout: "carousel",
      density: "compact",
      showProductImages: false,
      textColor: "#ffffff",
      mutedTextColor: "   ",
      unknownKey: "ignored",
    });

    expect(overrides.cardRadius).toBe("xl");
    expect(overrides.buttonStyle).toBe("outline");
    expect(overrides.density).toBe("compact");
    expect(overrides.showProductImages).toBe(false);
    expect(overrides.textColor).toBe("#ffffff");
    expect(overrides.productLayout).toBeUndefined();
    expect(overrides.mutedTextColor).toBeUndefined();
  });

  it("returns no overrides for empty or invalid input", () => {
    expect(parseMenuThemeOverrides(null)).toEqual({});
    expect(parseMenuThemeOverrides(undefined)).toEqual({});
    expect(parseMenuThemeOverrides({})).toEqual({});
  });

  it("produces a distinct style per button variant", () => {
    const solid = buttonStyleFor({ ...DEFAULT_MENU_THEME, buttonStyle: "solid" });
    const outline = buttonStyleFor({ ...DEFAULT_MENU_THEME, buttonStyle: "outline" });

    expect(solid.backgroundColor).toBe(DEFAULT_MENU_THEME.primaryColor);
    expect(outline.backgroundColor).toBe("transparent");
    expect(outline.border).toContain(DEFAULT_MENU_THEME.primaryColor);
  });
});

describe("buildMenuSeo", () => {
  it("builds title, description and image from real store data", () => {
    const seo = buildMenuSeo(
      storeSettings({
        organizationName: "Açaí do Cosmo",
        welcomeMessage: "O melhor açaí da cidade",
        bannerUrl: "https://cdn.example/banner.png",
      }),
      getNicheConfig("acai")
    );

    expect(seo.title).toContain("Açaí do Cosmo");
    expect(seo.title).toContain("Açaí / Sorveteria");
    expect(seo.description).toBe("O melhor açaí da cidade");
    expect(seo.imageUrl).toBe("https://cdn.example/banner.png");
  });

  it("falls back to the logo when there is no banner", () => {
    const seo = buildMenuSeo(
      storeSettings({ bannerUrl: null, logoUrl: "https://cdn.example/logo.png" }),
      getNicheConfig("generic")
    );

    expect(seo.imageUrl).toBe("https://cdn.example/logo.png");
  });

  it("truncates long descriptions to a sane meta length", () => {
    const seo = buildMenuSeo(
      storeSettings({ welcomeMessage: "a".repeat(400) }),
      getNicheConfig("generic")
    );

    expect(seo.description.length).toBeLessThanOrEqual(160);
  });

  it("degrades gracefully without a store", () => {
    const seo = buildMenuSeo(null, getNicheConfig("generic"));

    expect(seo.title.length).toBeGreaterThan(0);
    expect(seo.imageUrl).toBeNull();
  });

  it("points the public url at the menu route", () => {
    const seo = buildMenuSeo(
      storeSettings({ slug: "acai-do-cosmo" }),
      getNicheConfig("generic")
    );

    expect(seo.url).toContain("/menu/acai-do-cosmo");
  });
});
