import { describe, expect, it } from "vitest";
import {
  DEFAULT_MENU_TEMPLATE_ID,
  getMenuTemplate,
  isMenuTemplateId,
  listMenuTemplates,
  resolveMenuTemplateId,
} from "@/features/digital-ordering/menu/templates/menuTemplateRegistry";
import {
  appearanceFromTemplate,
  getActiveMenuTemplate,
  resolveActiveTemplateId,
  templateIdForNiche,
} from "@/features/digital-ordering/menu/templates/resolveMenuTemplate";
import { getNicheConfigForTemplate } from "@/features/digital-ordering/menu/config/nicheConfig";
import {
  resolveMenuCopy,
  resolveMenuFeatures,
} from "@/features/digital-ordering/menu/utils/resolveMenuPresentation";

describe("menuTemplateRegistry", () => {
  it("keeps the 12-template navigation and highlight defaults", () => {
    const food = [
      "acai",
      "cafeteria",
      "sushi",
      "burger",
      "icecream",
      "pastel",
      "marmita",
    ] as const;
    const filter = [
      "generic",
      "barbershop",
      "beauty",
      "retail",
      "services",
    ] as const;

    for (const id of food) {
      const template = getMenuTemplate(id);
      expect(template.defaults.features.catalogNavigation).toBe("sections");
      expect(template.defaults.theme.productLayout).toBe("list");
      expect(template.defaults.features.showHighlights).toBe(true);
    }

    for (const id of filter) {
      expect(
        getMenuTemplate(id).defaults.features.catalogNavigation ?? "filter"
      ).toBe("filter");
    }

    expect(getMenuTemplate("generic").defaults.features.showHighlights).toBe(true);
    expect(getMenuTemplate("barbershop").defaults.features.showHighlights).toBe(
      false
    );
    expect(getMenuTemplate("beauty").defaults.features.showHighlights).toBe(true);
    expect(getMenuTemplate("retail").defaults.features.showHighlights).toBe(true);
    expect(getMenuTemplate("services").defaults.features.showHighlights).toBe(
      false
    );
    expect(getMenuTemplate("retail").defaults.theme.productLayout).toBe("grid");
  });

  it("exposes the commercial template catalog", () => {
    const ids = listMenuTemplates().map((entry) => entry.id);
    for (const required of [
      "acai",
      "cafeteria",
      "sushi",
      "burger",
      "icecream",
      "pastel",
      "marmita",
      "barbershop",
      "beauty",
      "retail",
      "services",
    ] as const) {
      expect(ids).toContain(required);
    }
  });

  it("resolves unknown ids to generic", () => {
    expect(resolveMenuTemplateId("nope")).toBe(DEFAULT_MENU_TEMPLATE_ID);
    expect(isMenuTemplateId("acai")).toBe(true);
    expect(isMenuTemplateId("nope")).toBe(false);
  });

  it("never forks components — every template has copy + features + theme defaults", () => {
    for (const template of listMenuTemplates()) {
      expect(template.name.length).toBeGreaterThan(0);
      expect(template.description.length).toBeGreaterThan(0);
      expect(template.defaults.copy).toBeTruthy();
      expect(template.defaults.features).toBeTruthy();
      expect(template.capabilities.cardEmphasis).toBeTruthy();
    }
  });
});

describe("template ↔ niche mapping", () => {
  it("maps niches to commercial templates", () => {
    expect(templateIdForNiche("acai")).toBe("acai");
    expect(templateIdForNiche("hamburgueria")).toBe("burger");
    expect(templateIdForNiche("sorveteria")).toBe("icecream");
    expect(templateIdForNiche("barbearia")).toBe("barbershop");
    expect(templateIdForNiche("servicos")).toBe("services");
  });

  it("prefers explicit menuTemplateId over niche fallback", () => {
    expect(
      resolveActiveTemplateId({
        menuTemplateId: "beauty",
        niche: "servicos",
      })
    ).toBe("beauty");
    expect(
      resolveActiveTemplateId({
        menuTemplateId: null,
        niche: "servicos",
      })
    ).toBe("services");
  });
});

describe("appearanceFromTemplate", () => {
  it("seeds niche, composition tokens, copy and features without touching identity", () => {
    const appearance = appearanceFromTemplate("acai");

    expect(appearance.templateId).toBe("acai");
    expect(appearance.niche).toBe("acai");
    expect(appearance.menuCopy.catalogTitle).toBe("Monte seu açaí");
    expect(appearance.menuFeatures.showPopularBadge).toBe(true);
    expect(appearance.menuTheme.cardRadius).toBe("xl");
    expect(appearance).not.toHaveProperty("logoUrl");
    expect(appearance).not.toHaveProperty("bannerMessage");
  });

  it("barbershop uses service presentation defaults", () => {
    const appearance = appearanceFromTemplate("barbershop");
    const template = getMenuTemplate("barbershop");

    expect(appearance.niche).toBe("barbearia");
    expect(appearance.menuCopy.addToCartLabel).toBe("Agendar");
    expect(appearance.menuFeatures.showProductImages).toBe(false);
    expect(template.capabilities.cardEmphasis).toBe("service");
  });
});

describe("configuration precedence", () => {
  it("store copy overrides template defaults", () => {
    const config = getNicheConfigForTemplate("acai", "acai");
    const copy = resolveMenuCopy(config, {
      catalogTitle: "Açaí da casa",
      addToCartLabel: "Colocar no pedido",
    });

    expect(copy.catalogTitle).toBe("Açaí da casa");
    expect(copy.addToCartLabel).toBe("Colocar no pedido");
    expect(copy.highlightsTitle).toBe(config.copy.highlightsTitle);
  });

  it("store features override template defaults", () => {
    const config = getNicheConfigForTemplate("cafeteria", "cafeteria");
    const features = resolveMenuFeatures(config, {
      showHighlights: false,
      showPopularBadge: false,
    });

    expect(features.showHighlights).toBe(false);
    expect(features.showPopularBadge).toBe(false);
    expect(features.showSearch).toBe(true);
  });

  it("beauty and services can share niche with different templates", () => {
    const beauty = getActiveMenuTemplate({ menuTemplateId: "beauty" });
    const services = getActiveMenuTemplate({ menuTemplateId: "services" });

    expect(beauty.niche).toBe("servicos");
    expect(services.niche).toBe("servicos");
    expect(beauty.defaults.copy.catalogTitle).not.toBe(
      services.defaults.copy.catalogTitle
    );
    expect(beauty.capabilities.showProductImages).toBe(true);
    expect(services.capabilities.showProductImages).toBe(false);
  });
});
