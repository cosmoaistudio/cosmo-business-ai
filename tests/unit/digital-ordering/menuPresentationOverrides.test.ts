import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  getNicheConfig,
  getNicheConfigForTemplate,
} from "@/features/digital-ordering/menu/config/nicheConfig";
import { useMenuTheme } from "@/features/digital-ordering/menu/hooks/useMenuTheme";
import {
  resolveEffectiveProductImages,
  resolveMenuCopy,
  resolveMenuFeatures,
  resolveShowProductImages,
  sanitizeMenuCopyOverrides,
} from "@/features/digital-ordering/menu/utils/resolveMenuPresentation";
import {
  mapRowToSettings,
  settingsToUpsertPayload,
  type DigitalStoreRow,
} from "@/features/digital-ordering/utils/digitalStoreMappers";
import { DEFAULT_DIGITAL_PAYMENT_SETTINGS } from "@/features/digital-ordering/types/digitalPayment.types";
import type { DigitalStoreSettings } from "@/features/digital-ordering/types/digitalStore.types";
import { DEFAULT_DIGITAL_STORE_THEME } from "@/features/digital-ordering/types/digitalStore.types";

function storeSettings(
  overrides: Partial<DigitalStoreSettings> = {}
): DigitalStoreSettings {
  return {
    slug: "cosmo-business",
    organizationId: "org-1",
    organizationName: "Cosmo Business",
    logoUrl: null,
    bannerUrl: null,
    welcomeMessage: "Bem-vindo",
    bannerMessage: null,
    theme: DEFAULT_DIGITAL_STORE_THEME,
    niche: "acai",
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

describe("resolveMenuCopy / resolveMenuFeatures", () => {
  it("uses niche defaults when the store has no customization", () => {
    const config = getNicheConfig("acai");
    const copy = resolveMenuCopy(config, {});
    const features = resolveMenuFeatures(config, {});

    expect(copy.customizableLabel).toBe(config.copy.customizableLabel);
    expect(copy.searchPlaceholder).toBe(config.copy.searchPlaceholder);
    expect(features.showProductImages).toBe(true);
    expect(features.showHighlights).toBe(true);
  });

  it("gives store copy priority over niche defaults", () => {
    const config = getNicheConfig("hamburgueria");
    const copy = resolveMenuCopy(config, {
      customizableLabel: "Monte seu lanche",
      addToCartLabel: "Colocar no pedido",
    });

    expect(copy.customizableLabel).toBe("Monte seu lanche");
    expect(copy.addToCartLabel).toBe("Colocar no pedido");
    expect(copy.searchPlaceholder).toBe(config.copy.searchPlaceholder);
  });

  it("ignores blank copy overrides so niche defaults remain", () => {
    expect(
      sanitizeMenuCopyOverrides({
        customizableLabel: "   ",
        addToCartLabel: "Adicionar",
      })
    ).toEqual({ addToCartLabel: "Adicionar" });
  });

  it("lets store features override showHighlights / images", () => {
    const config = getNicheConfig("adega");
    const features = resolveMenuFeatures(config, {
      showHighlights: true,
      showProductImages: false,
    });

    expect(features.showHighlights).toBe(true);
    expect(features.showProductImages).toBe(false);
  });

  it("lets store catalogNavigation override the template without wiping other flags", () => {
    const config = getNicheConfig("acai");
    const features = resolveMenuFeatures(config, {
      catalogNavigation: "filter",
    });

    expect(features.catalogNavigation).toBe("filter");
    expect(features.showSearch).toBe(true);
  });
});

describe("resolveShowProductImages", () => {
  const food = getNicheConfigForTemplate("acai", "acai");
  const services = getNicheConfigForTemplate("servicos", "services");

  it("A: template allows images and no override keeps the template default", () => {
    expect(food.features.showProductImages).toBe(true);
    expect(
      resolveShowProductImages({
        capability: food.features.showProductImages,
        themeDefault: food.theme.showProductImages ?? true,
      })
    ).toBe(true);
    expect(resolveEffectiveProductImages(food).enabled).toBe(true);
  });

  it("B: template allows images and STORE/OVERRIDE false turns them off", () => {
    expect(
      resolveShowProductImages({
        capability: true,
        themeDefault: true,
        storeTheme: false,
      })
    ).toBe(false);
    expect(
      resolveEffectiveProductImages(food, { showProductImages: false }).enabled
    ).toBe(false);
  });

  it("C: template allows images and STORE/OVERRIDE true keeps them on", () => {
    expect(
      resolveShowProductImages({
        capability: true,
        themeDefault: true,
        storeTheme: true,
      })
    ).toBe(true);
    expect(
      resolveEffectiveProductImages(food, { showProductImages: true }).enabled
    ).toBe(true);
  });

  it("D: template/niche that forbids images stays off even if visual config tries to enable", () => {
    expect(services.features.showProductImages).toBe(false);
    expect(
      resolveShowProductImages({
        capability: services.features.showProductImages,
        themeDefault: services.theme.showProductImages ?? true,
        storeTheme: true,
        storeFeature: true,
      })
    ).toBe(false);
    expect(
      resolveEffectiveProductImages(
        services,
        { showProductImages: true },
        { showProductImages: true }
      ).enabled
    ).toBe(false);
  });

  it("E: missing configuration inherits instead of becoming false", () => {
    expect(
      resolveShowProductImages({
        capability: true,
        themeDefault: true,
        storeTheme: undefined,
        storeFeature: undefined,
      })
    ).toBe(true);
    expect(
      resolveEffectiveProductImages(food, {}, {}).enabled
    ).toBe(true);
    expect(
      resolveShowProductImages({
        capability: true,
        themeDefault: true,
        storeTheme: null,
        storeFeature: "nope",
      })
    ).toBe(true);
  });

  it("F: preview and public resolve product images the same way", () => {
    const store = storeSettings({
      niche: "acai",
      menuTemplateId: "acai",
      menuTheme: { showProductImages: false },
    });

    const { result: publicView } = renderHook(() => useMenuTheme(store));
    const { result: preview } = renderHook(() =>
      useMenuTheme(store, store.niche, store.menuTheme)
    );

    expect(publicView.current.showProductImages).toBe(false);
    expect(preview.current.showProductImages).toBe(
      publicView.current.showProductImages
    );
    expect(preview.current.allowsProductImages).toBe(
      publicView.current.allowsProductImages
    );

    const serviceStore = storeSettings({
      niche: "servicos",
      menuTemplateId: "services",
      menuTheme: { showProductImages: true },
      menuFeatures: { showProductImages: true },
    });
    const { result: publicService } = renderHook(() => useMenuTheme(serviceStore));
    const { result: previewService } = renderHook(() =>
      useMenuTheme(serviceStore, serviceStore.niche, serviceStore.menuTheme)
    );

    expect(publicService.current.showProductImages).toBe(false);
    expect(previewService.current.showProductImages).toBe(false);
  });
});

describe("menu presentation persistence", () => {
  it("round-trips menuCopy and menuFeatures through settings jsonb", () => {
    const original = storeSettings({
      menuCopy: { customizableLabel: "Monte o seu açaí" },
      menuFeatures: { showHighlights: false, catalogNavigation: "sections" },
      menuTheme: { imageAspect: "portrait", showProductImages: true },
    });

    const payload = settingsToUpsertPayload(
      original,
      DEFAULT_DIGITAL_PAYMENT_SETTINGS,
      []
    );

    expect(payload.settings.menuCopy).toEqual({
      customizableLabel: "Monte o seu açaí",
    });
    expect(payload.settings.menuFeatures).toEqual({
      showHighlights: false,
      catalogNavigation: "sections",
    });
    expect(payload.theme.imageAspect).toBe("portrait");

    const row = {
      id: "store-1",
      organization_id: original.organizationId,
      slug: payload.slug,
      name: payload.name,
      enabled: true,
      logo_url: null,
      banner_url: null,
      welcome_message: payload.welcome_message,
      theme: payload.theme as Record<string, unknown>,
      settings: payload.settings as unknown as Record<string, unknown>,
      qr_codes: [],
      catalog_snapshot: null,
      published_at: null,
    } satisfies DigitalStoreRow;

    const restored = mapRowToSettings(row, original.organizationName);
    expect(restored.menuCopy.customizableLabel).toBe("Monte o seu açaí");
    expect(restored.menuFeatures.showHighlights).toBe(false);
    expect(restored.menuFeatures.catalogNavigation).toBe("sections");
    expect(restored.menuTheme.imageAspect).toBe("portrait");
  });

  it("keeps empty overrides for stores without customization", () => {
    const restored = mapRowToSettings(
      {
        id: "store-1",
        organization_id: "org-1",
        slug: "loja",
        name: "Loja",
        enabled: true,
        logo_url: null,
        banner_url: null,
        welcome_message: "Oi",
        theme: null,
        settings: { niche: "generic" },
        qr_codes: null,
        catalog_snapshot: null,
        published_at: null,
      } satisfies DigitalStoreRow,
      "Loja"
    );

    expect(restored.menuCopy).toEqual({});
    expect(restored.menuFeatures).toEqual({});
  });
});
