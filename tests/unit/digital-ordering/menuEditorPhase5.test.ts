import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useEditorHistory } from "@/features/digital-ordering/menu/admin/editor/useEditorHistory";
import { templateAppearancePatch } from "@/features/digital-ordering/menu/admin/editor/MenuEditorPanels";
import {
  canStartPublish,
  publishedFlagAfterAttempt,
  resolvePublishTargetSlug,
} from "@/features/digital-ordering/menu/admin/editor/publishDraft";
import { sectionSnapshot } from "@/features/digital-ordering/menu/admin/editor/resetEditorSection";
import {
  buildStoreAssetPath,
  isOrganizationId,
  isOwnStoreAssetPath,
  validateStoreAssetFile,
} from "@/features/digital-ordering/menu/admin/editor/storeAsset.service";
import { listMenuTemplates } from "@/features/digital-ordering/menu/templates/menuTemplateRegistry";
import { appearanceFromTemplate } from "@/features/digital-ordering/menu/templates/resolveMenuTemplate";
import {
  resolveCtaPlacement,
  resolvePricePlacement,
} from "@/features/digital-ordering/menu/theme/cardPlacement";
import { evaluateMenuContrast } from "@/features/digital-ordering/menu/theme/contrastHint";
import {
  applyIsolatedCartAction,
  buildPreviewOrderContext,
  checkoutTotalsForPreview,
  previewCartUnchanged,
  shouldIsolatePreviewMutations,
  snapshotPreviewCart,
} from "@/features/digital-ordering/menu/theme/previewOrderContext";
import { DEFAULT_DIGITAL_STORE_THEME } from "@/features/digital-ordering/types/digitalStore.types";
import type { DigitalStoreSettings } from "@/features/digital-ordering/types/digitalStore.types";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";

function settings(
  overrides: Partial<DigitalStoreSettings> = {}
): DigitalStoreSettings {
  return {
    slug: "loja-demo",
    organizationId: ORG_A,
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
    minimumOrder: 25,
    deliveryFee: 8,
    averagePrepMinutes: 20,
    publishedAt: null,
    ...overrides,
  };
}

function product(name: string, price: number): DigitalMenuProduct {
  return {
    id: `p-${name}`,
    name,
    description: "",
    basePrice: price,
    promotionalPrice: null,
    imageUrl: null,
    category: "Geral",
    available: true,
    groups: [],
    popular: false,
  } as DigitalMenuProduct;
}

describe("storage isolation", () => {
  it("scopes store assets to the authenticated organization folder", () => {
    const path = buildStoreAssetPath(ORG_A, "banner", 9, "ff00aa");
    expect(path).toBe(`${ORG_A}/store/banner-9-ff00aa.webp`);
    expect(isOrganizationId(ORG_A)).toBe(true);
    expect(isOwnStoreAssetPath(path, ORG_A)).toBe(true);
    expect(isOwnStoreAssetPath(path, ORG_B)).toBe(false);
    expect(isOwnStoreAssetPath(`${ORG_A}/${"prod-1"}-9.webp`, ORG_A)).toBe(false);
    expect(isOwnStoreAssetPath(`${ORG_B}/store/logo-1-aa.webp`, ORG_A)).toBe(
      false
    );
  });
});

describe("upload validation", () => {
  it("rejects spoofed extension or unsupported MIME", () => {
    expect(() =>
      validateStoreAssetFile(
        new File([new Uint8Array([1, 2, 3])], "logo.exe", {
          type: "application/octet-stream",
        })
      )
    ).toThrow(/JPG, PNG ou WebP/);

    expect(() =>
      validateStoreAssetFile(
        new File([new Uint8Array([1, 2, 3])], "logo.exe", {
          type: "image/jpeg",
        })
      )
    ).toThrow(/JPG, PNG ou WebP/);

    expect(() =>
      validateStoreAssetFile(
        new File([new Uint8Array([0xff, 0xd8, 0xff])], "logo.jpg", {
          type: "image/jpeg",
        })
      )
    ).not.toThrow();
  });
});

describe("preview does not mutate cart", () => {
  it("isolates inspect mutations and keeps checkout totals demonstrative", () => {
    const products = [product("Açaí 500ml", 22)];
    const previewOrder = buildPreviewOrderContext(products, { deliveryFee: 9 });
    expect(previewOrder.demo).toBe(true);
    expect(previewOrder.productName).toBe("Açaí 500ml");
    expect(previewOrder.quantity).toBe(1);
    expect(previewOrder.subtotal).toBe(22);
    expect(previewOrder.deliveryFee).toBe(0);
    expect(previewOrder.total).toBe(22);

    const liveCart = {
      itemCount: 3,
      items: [
        {
          product: { id: "real-1" },
          quantity: 2,
          selectedOptions: [{ optionId: "extra" }],
        },
      ],
      observation: "sem açúcar",
      coupon: { code: "PROMO" },
      summary: { total: 80, subtotal: 70, deliveryFee: 10 },
    };

    const before = snapshotPreviewCart(liveCart);
    expect(shouldIsolatePreviewMutations(true, "checkout")).toBe(true);
    expect(shouldIsolatePreviewMutations(true, "productsheet")).toBe(true);
    expect(shouldIsolatePreviewMutations(true, null)).toBe(false);
    expect(shouldIsolatePreviewMutations(false, "checkout")).toBe(false);

    const mutated = applyIsolatedCartAction(
      true,
      () => {
        liveCart.itemCount = 99;
        return liveCart.itemCount;
      },
      liveCart.itemCount
    );
    expect(mutated).toBe(3);
    expect(previewCartUnchanged(before, snapshotPreviewCart(liveCart))).toBe(
      true
    );

    const totals = checkoutTotalsForPreview(
      "checkout",
      previewOrder,
      liveCart.summary
    );
    expect(totals).toEqual({
      total: 22,
      subtotal: 22,
      deliveryFee: 0,
    });

    const browsingTotals = checkoutTotalsForPreview(
      null,
      previewOrder,
      liveCart.summary
    );
    expect(browsingTotals).toEqual(liveCart.summary);
  });
});

describe("publicação após save / erro", () => {
  it("publishes the slug that was just saved, not a stale hook snapshot", () => {
    expect(resolvePublishTargetSlug("novo-slug", "slug-antigo")).toBe(
      "novo-slug"
    );
    expect(resolvePublishTargetSlug(undefined, "slug-antigo")).toBe(
      "slug-antigo"
    );
    expect(canStartPublish({ publishing: true, ready: true })).toBe(false);
    expect(canStartPublish({ publishing: false, saving: true, ready: true })).toBe(
      false
    );
    expect(canStartPublish({ publishing: false, ready: true })).toBe(true);
    expect(
      publishedFlagAfterAttempt({ success: false, productCount: 4 })
    ).toBe(false);
    expect(
      publishedFlagAfterAttempt({ success: true, productCount: 0 })
    ).toBe(false);
    expect(
      publishedFlagAfterAttempt({ success: true, productCount: 4 })
    ).toBe(true);
  });
});

describe("template switch preserves commercial data", () => {
  it("A → B → personalização → A does not rewrite products, prices or checkout", () => {
    const commercial = settings({
      slug: "cosmo-business",
      minimumOrder: 40,
      deliveryFee: 12,
      acceptsDelivery: false,
      organizationName: "Cosmo",
    });
    const toSushi = templateAppearancePatch("sushi");
    expect(toSushi).not.toHaveProperty("slug");
    expect(toSushi).not.toHaveProperty("minimumOrder");
    expect(toSushi).not.toHaveProperty("deliveryFee");
    expect(toSushi).not.toHaveProperty("acceptsDelivery");
    expect(toSushi).not.toHaveProperty("publishedAt");

    const afterSushi = { ...commercial, ...toSushi, menuTheme: { cardRadius: "none" } };
    expect(afterSushi.slug).toBe("cosmo-business");
    expect(afterSushi.minimumOrder).toBe(40);
    expect(afterSushi.deliveryFee).toBe(12);
    expect(afterSushi.acceptsDelivery).toBe(false);

    const backToAcai = { ...afterSushi, ...templateAppearancePatch("acai") };
    expect(backToAcai.slug).toBe(commercial.slug);
    expect(backToAcai.minimumOrder).toBe(commercial.minimumOrder);
    expect(backToAcai.deliveryFee).toBe(commercial.deliveryFee);
    expect(backToAcai.organizationName).toBe("Cosmo");
    expect(appearanceFromTemplate("acai").menuTheme).toEqual(
      templateAppearancePatch("acai").menuTheme
    );
  });
});

describe("unsaved / reset / undo / placements", () => {
  it("detects dirty draft and keeps section restore appearance-only", () => {
    const saved = settings({ welcomeMessage: "Olá" });
    const draft = { ...saved, welcomeMessage: "Novo" };
    expect(JSON.stringify(draft) !== JSON.stringify(saved)).toBe(true);
    expect(JSON.stringify({ ...draft, welcomeMessage: "Olá" }) === JSON.stringify(saved)).toBe(
      true
    );
    expect(sectionSnapshot("identity", saved)).toMatchObject({
      welcomeMessage: "Olá",
    });
    expect(sectionSnapshot("identity", saved)).not.toHaveProperty("minimumOrder");
  });

  it("undo restores the previous appearance patch", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useEditorHistory(settings(), onChange)
    );
    act(() => {
      result.current.pushAndPatch(
        { menuTheme: { pricePosition: "inline" } },
        { section: "products" }
      );
    });
    expect(onChange).toHaveBeenLastCalledWith({
      menuTheme: { pricePosition: "inline" },
    });
    act(() => {
      expect(result.current.undo()).toBe(true);
    });
    expect(onChange).toHaveBeenLastCalledWith({ menuTheme: {} });
  });

  it("clears undo history so discard cannot replay stale patches", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useEditorHistory(settings(), onChange)
    );
    act(() => {
      result.current.pushAndPatch({ welcomeMessage: "Rascunho" });
    });
    expect(result.current.canUndo).toBe(true);
    act(() => {
      result.current.clear();
    });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.historySize).toBe(0);
    act(() => {
      expect(result.current.undo()).toBe(false);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("resolves price and CTA from theme, never from niche branches", () => {
    for (const template of listMenuTemplates()) {
      const appearance = appearanceFromTemplate(template.id);
      expect(resolvePricePlacement(appearance.menuTheme.pricePosition)).toBeTruthy();
      expect(resolveCtaPlacement(appearance.menuTheme.ctaPosition)).toBeTruthy();
      const report = evaluateMenuContrast({
        primaryColor: appearance.theme.primaryColor,
        backgroundColor: appearance.theme.backgroundColor,
        surfaceColor: appearance.menuTheme.surfaceColor ?? "#ffffff",
        textColor: appearance.menuTheme.textColor ?? "#111111",
        mutedTextColor: appearance.menuTheme.mutedTextColor ?? "#667085",
        accentColor: appearance.theme.accentColor,
      });
      expect(report.pairs).toHaveLength(8);
    }
  });
});

describe("QA matrix — 12 templates", () => {
  it("covers every commercial template through the registry only", () => {
    const ids = listMenuTemplates().map((template) => template.id);
    expect(ids).toEqual([
      "generic",
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
    ]);
    for (const id of ids) {
      const appearance = appearanceFromTemplate(id);
      expect(appearance.templateId).toBe(id);
      expect(appearance.theme.primaryColor).toMatch(/^#/);
      expect((appearance.menuCopy.addToCartLabel ?? "").length).toBeGreaterThan(
        0
      );
    }
  });
});
