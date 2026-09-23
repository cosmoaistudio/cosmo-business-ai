import { describe, expect, it } from "vitest";
import {
  PREVIEW_SELECTABLE_TO_SECTION,
  previewTargetForSection,
  sectionForPreviewTarget,
} from "@/features/digital-ordering/menu/admin/editor/previewSelectMap";
import {
  hasVisualCustomization,
  resetSectionPatch,
} from "@/features/digital-ordering/menu/admin/editor/resetEditorSection";
import {
  resolveCtaPlacement,
  resolvePricePlacement,
} from "@/features/digital-ordering/menu/theme/cardPlacement";
import { contrastHint, contrastWarning } from "@/features/digital-ordering/menu/theme/contrastHint";
import { appearanceFromTemplate } from "@/features/digital-ordering/menu/templates/resolveMenuTemplate";
import { getMenuTemplate, listMenuTemplates } from "@/features/digital-ordering/menu/templates/menuTemplateRegistry";
import { getTemplateGalleryMeta } from "@/features/digital-ordering/menu/templates/templateGalleryMeta";
import { DEFAULT_DIGITAL_STORE_THEME } from "@/features/digital-ordering/types/digitalStore.types";
import type { DigitalStoreSettings } from "@/features/digital-ordering/types/digitalStore.types";

function settings(
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

describe("preview element → editor section map", () => {
  it("maps every selectable to a centralized section", () => {
    expect(sectionForPreviewTarget("header")).toBe("identity");
    expect(sectionForPreviewTarget("banner")).toBe("banner");
    expect(sectionForPreviewTarget("card")).toBe("products");
    expect(sectionForPreviewTarget("checkout")).toBe("checkout");
    expect(sectionForPreviewTarget("search")).toBe("categories");
    expect(PREVIEW_SELECTABLE_TO_SECTION.catalog).toBe("layout");
  });

  it("maps sections back to preview targets for highlight", () => {
    expect(previewTargetForSection("identity")).toBe("header");
    expect(previewTargetForSection("banner")).toBe("banner");
    expect(previewTargetForSection("products")).toBe("card");
    expect(previewTargetForSection("checkout")).toBe("checkout");
    expect(previewTargetForSection("colors")).toBe("header");
  });
});

describe("pricePosition / ctaPosition", () => {
  it("resolves aliases to visual placements", () => {
    expect(resolvePricePlacement("top")).toBe("top");
    expect(resolvePricePlacement("below")).toBe("bottom");
    expect(resolvePricePlacement("trailing")).toBe("inline");
    expect(resolvePricePlacement("inline")).toBe("inline");
    expect(resolveCtaPlacement("full")).toBe("full");
    expect(resolveCtaPlacement("footer")).toBe("bottom");
    expect(resolveCtaPlacement("inline")).toBe("inline");
  });

  it("seeds distinct placements from the template registry", () => {
    expect(appearanceFromTemplate("acai").menuTheme.pricePosition).toBe("top");
    expect(appearanceFromTemplate("acai").menuTheme.ctaPosition).toBe("full");
    expect(appearanceFromTemplate("cafeteria").menuTheme.pricePosition).toBe(
      "bottom"
    );
    expect(appearanceFromTemplate("sushi").menuTheme.pricePosition).toBe(
      "inline"
    );
    expect(appearanceFromTemplate("barbershop").menuTheme.ctaPosition).toBe(
      "full"
    );
  });
});

describe("template metadata and switching", () => {
  it("exposes gallery tags from the registry", () => {
    const acai = getTemplateGalleryMeta(getMenuTemplate("acai"));
    expect(acai.tags).toEqual(["Produto", "Combos", "Adicionais"]);
    expect(acai.pitch).toMatch(/produtos/i);
    for (const template of listMenuTemplates()) {
      expect(getTemplateGalleryMeta(template).tags.length).toBeGreaterThan(0);
    }
  });

  it("detects visual customizations before confirming a switch", () => {
    expect(hasVisualCustomization(settings(), "acai")).toBe(false);
    expect(
      hasVisualCustomization(
        settings({ menuTheme: { primaryColor: "#ff0000" } }),
        "acai"
      )
    ).toBe(true);
    expect(
      hasVisualCustomization(settings({ menuTheme: { cardRadius: "xl" } }), "acai")
    ).toBe(false);
  });
});

describe("section reset", () => {
  it("restores only the requested section from the template", () => {
    const current = settings({
      menuTheme: {
        primaryColor: "#111111",
        pricePosition: "inline",
        bannerHeight: "sm",
      },
      menuCopy: { checkoutLabel: "Custom" },
    });

    const colors = resetSectionPatch("colors", "acai", current);
    expect(colors.theme).toEqual(appearanceFromTemplate("acai").theme);
    expect(colors.menuTheme?.pricePosition).toBe("inline");
    expect(colors.menuTheme?.primaryColor).toBe("#111111");

    const banner = resetSectionPatch("banner", "acai", current);
    expect(banner.menuTheme?.bannerHeight).toBe(
      appearanceFromTemplate("acai").menuTheme.bannerHeight
    );
    expect(banner.menuTheme?.primaryColor).toBe("#111111");

    const checkout = resetSectionPatch("checkout", "acai", current);
    expect(checkout.menuCopy).toEqual(appearanceFromTemplate("acai").menuCopy);
    expect(checkout.menuTheme).toBeUndefined();
  });
});

describe("contrast helper", () => {
  it("warns without changing the color", () => {
    expect(contrastHint("#eeeeee", "#ffffff")).toBe("low");
    expect(contrastWarning("#eeeeee", "#ffffff")).toBe(
      "Esta combinação pode ter baixo contraste."
    );
    expect(contrastHint("#111111", "#ffffff")).toBe("ok");
    expect(contrastWarning("#111111", "#ffffff")).toBeNull();
  });
});

