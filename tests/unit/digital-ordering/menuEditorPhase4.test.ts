import { describe, expect, it } from "vitest";
import { MENU_EDITOR_NAV_GROUPS } from "@/features/digital-ordering/menu/admin/editor/menuEditor.types";
import {
  sectionHasDraftChanges,
  sectionSnapshot,
} from "@/features/digital-ordering/menu/admin/editor/resetEditorSection";
import { buildStoreAssetPath } from "@/features/digital-ordering/menu/admin/editor/storeAsset.service";
import { sectionForPreviewTarget } from "@/features/digital-ordering/menu/admin/editor/previewSelectMap";
import { getTemplateGalleryMeta } from "@/features/digital-ordering/menu/templates/templateGalleryMeta";
import { getMenuTemplate, listMenuTemplates } from "@/features/digital-ordering/menu/templates/menuTemplateRegistry";
import { appearanceFromTemplate } from "@/features/digital-ordering/menu/templates/resolveMenuTemplate";
import {
  resolveCtaPlacement,
  resolvePricePlacement,
} from "@/features/digital-ordering/menu/theme/cardPlacement";
import { contrastHint } from "@/features/digital-ordering/menu/theme/contrastHint";
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

describe("editor taxonomy", () => {
  it("groups existing sections without dropping them", () => {
    const ids = MENU_EDITOR_NAV_GROUPS.flatMap((group) =>
      group.items.map((item) => item.section)
    );
    for (const required of [
      "style",
      "identity",
      "colors",
      "typography",
      "layout",
      "products",
      "categories",
      "banner",
      "buttons",
      "checkout",
      "advanced",
    ] as const) {
      expect(ids).toContain(required);
    }
    expect(MENU_EDITOR_NAV_GROUPS.map((group) => group.id)).toEqual([
      "appearance",
      "menu",
      "conversion",
      "advanced",
    ]);
  });
});

describe("gallery metadata from registry", () => {
  it("exposes density, card, price and CTA from template defaults", () => {
    const acai = getTemplateGalleryMeta(getMenuTemplate("acai"));
    expect(acai.density).toBe(getMenuTemplate("acai").defaults.theme.density);
    expect(acai.pricePosition).toBe(
      getMenuTemplate("acai").defaults.theme.pricePosition
    );
    expect(acai.ctaPosition).toBe(
      getMenuTemplate("acai").defaults.theme.ctaPosition
    );
    for (const template of listMenuTemplates()) {
      const meta = getTemplateGalleryMeta(template);
      expect(meta.pitch.length).toBeGreaterThan(0);
      expect(meta.tags.length).toBeGreaterThan(0);
    }
  });
});

describe("store asset path", () => {
  it("uses the existing product-images org/store convention", () => {
    const path = buildStoreAssetPath(
      "11111111-1111-4111-8111-111111111111",
      "logo",
      1,
      "aa"
    );
    expect(path).toBe(
      "11111111-1111-4111-8111-111111111111/store/logo-1-aa.webp"
    );
  });
});

describe("saved vs draft section restore", () => {
  it("detects only the changed section", () => {
    const saved = settings({ menuCopy: { checkoutLabel: "Finalizar" } });
    const draft = settings({
      menuCopy: { checkoutLabel: "Fechar" },
      menuTheme: { cardRadius: "xl" },
    });
    expect(sectionHasDraftChanges("checkout", draft, saved)).toBe(true);
    expect(sectionSnapshot("checkout", saved)).toEqual({
      menuCopy: { checkoutLabel: "Finalizar" },
    });
  });
});

describe("preview inspect mapping", () => {
  it("keeps productsheet and checkout on existing panels", () => {
    expect(sectionForPreviewTarget("productsheet")).toBe("products");
    expect(sectionForPreviewTarget("checkout")).toBe("checkout");
  });
});

describe("price/cta + contrast still theme-driven", () => {
  it("applies template seeds through helpers, not niche branches", () => {
    const sushi = appearanceFromTemplate("sushi");
    expect(resolvePricePlacement(sushi.menuTheme.pricePosition)).toBe("inline");
    expect(resolveCtaPlacement(sushi.menuTheme.ctaPosition)).toBe("bottom");
    expect(contrastHint("#111111", "#ffffff")).toBe("ok");
  });
});
