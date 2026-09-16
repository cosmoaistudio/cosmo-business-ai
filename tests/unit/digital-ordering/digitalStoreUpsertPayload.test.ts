import { describe, expect, it } from "vitest";
import {
  mapRowToSettings,
  settingsToUpsertPayload,
  type DigitalStoreRow,
} from "@/features/digital-ordering/utils/digitalStoreMappers";
import { DEFAULT_DIGITAL_PAYMENT_SETTINGS } from "@/features/digital-ordering/types/digitalPayment.types";
import type { DigitalStoreSettings } from "@/features/digital-ordering/types/digitalStore.types";
import { DEFAULT_DIGITAL_STORE_THEME } from "@/features/digital-ordering/types/digitalStore.types";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";

function storeSettings(
  overrides: Partial<DigitalStoreSettings> = {}
): DigitalStoreSettings {
  return {
    slug: "Loja Teste",
    organizationId: "org-1",
    organizationName: "Loja Teste",
    logoUrl: null,
    bannerUrl: null,
    welcomeMessage: "Bem-vindo",
    bannerMessage: "Frete grátis hoje",
    theme: DEFAULT_DIGITAL_STORE_THEME,
    niche: "pizzaria",
    menuTheme: { cardRadius: "xl", buttonStyle: "outline" },
    acceptsPickup: true,
    acceptsDelivery: true,
    acceptsDineIn: true,
    minimumOrder: 25,
    deliveryFee: 7,
    averagePrepMinutes: 30,
    publishedAt: "2026-01-01T12:00:00.000Z",
    ...overrides,
  };
}

const snapshot: DigitalMenuProduct[] = [
  {
    id: "p-1",
    name: "Pizza Calabresa",
    basePrice: 49.9,
    available: true,
    menuKind: "simple",
    imageUrl: null,
    categoryName: "Pizzas Salgadas",
    description: null,
    promotionalPrice: null,
    featured: false,
    groups: [],
  },
];

describe("settingsToUpsertPayload", () => {
  it("omits catalog_snapshot when no snapshot is provided", () => {
    const payload = settingsToUpsertPayload(
      storeSettings(),
      DEFAULT_DIGITAL_PAYMENT_SETTINGS,
      []
    );

    // Overwriting with [] here would erase the published catalog.
    expect("catalog_snapshot" in payload).toBe(false);
  });

  it("writes catalog_snapshot when a snapshot is provided", () => {
    const payload = settingsToUpsertPayload(
      storeSettings(),
      DEFAULT_DIGITAL_PAYMENT_SETTINGS,
      [],
      snapshot
    );

    expect(payload.catalog_snapshot).toHaveLength(1);
  });

  it("writes an explicitly empty snapshot when asked to clear it", () => {
    const payload = settingsToUpsertPayload(
      storeSettings(),
      DEFAULT_DIGITAL_PAYMENT_SETTINGS,
      [],
      []
    );

    expect(payload.catalog_snapshot).toEqual([]);
  });

  it("normalizes the slug", () => {
    const payload = settingsToUpsertPayload(
      storeSettings({ slug: "Loja Teste" }),
      DEFAULT_DIGITAL_PAYMENT_SETTINGS,
      []
    );

    expect(payload.slug).toBe("loja-teste");
  });

  it("persists niche and banner message inside the settings jsonb", () => {
    const payload = settingsToUpsertPayload(
      storeSettings(),
      DEFAULT_DIGITAL_PAYMENT_SETTINGS,
      []
    );

    expect(payload.settings.niche).toBe("pizzaria");
    expect(payload.settings.bannerMessage).toBe("Frete grátis hoje");
  });

  it("merges menu theme tokens into the theme jsonb alongside legacy colors", () => {
    const payload = settingsToUpsertPayload(
      storeSettings(),
      DEFAULT_DIGITAL_PAYMENT_SETTINGS,
      []
    );

    expect(payload.theme.primaryColor).toBe(
      DEFAULT_DIGITAL_STORE_THEME.primaryColor
    );
    expect(payload.theme.cardRadius).toBe("xl");
    expect(payload.theme.buttonStyle).toBe("outline");
  });
});

describe("settings round-trip", () => {
  it("restores niche, banner message and menu theme from persisted jsonb", () => {
    const original = storeSettings();
    const payload = settingsToUpsertPayload(
      original,
      DEFAULT_DIGITAL_PAYMENT_SETTINGS,
      []
    );

    const row = {
      id: "store-1",
      organization_id: original.organizationId,
      slug: payload.slug,
      name: payload.name,
      enabled: true,
      logo_url: payload.logo_url,
      banner_url: payload.banner_url,
      welcome_message: payload.welcome_message,
      theme: payload.theme as Record<string, unknown>,
      settings: payload.settings as unknown as Record<string, unknown>,
      qr_codes: [],
      catalog_snapshot: null,
      published_at: payload.published_at,
    } satisfies DigitalStoreRow;

    const restored = mapRowToSettings(row, original.organizationName);

    expect(restored.niche).toBe("pizzaria");
    expect(restored.bannerMessage).toBe("Frete grátis hoje");
    expect(restored.menuTheme.cardRadius).toBe("xl");
    expect(restored.menuTheme.buttonStyle).toBe("outline");
    expect(restored.theme.primaryColor).toBe(
      DEFAULT_DIGITAL_STORE_THEME.primaryColor
    );
    expect(restored.minimumOrder).toBe(25);
    expect(restored.averagePrepMinutes).toBe(30);
  });

  it("preserves bannerMessage and omits catalog_snapshot when only the niche changes", () => {
    const original = storeSettings({
      niche: "acai",
      bannerMessage: "Frete grátis hoje",
    });
    const next = { ...original, niche: "hamburgueria" as const };
    const payload = settingsToUpsertPayload(
      next,
      DEFAULT_DIGITAL_PAYMENT_SETTINGS,
      []
    );

    expect(payload.settings.niche).toBe("hamburgueria");
    expect(payload.settings.bannerMessage).toBe("Frete grátis hoje");
    expect("catalog_snapshot" in payload).toBe(false);
  });


  it("falls back to the generic niche for an unknown persisted value", () => {
    const row = {
      id: "store-1",
      organization_id: "org-1",
      slug: "loja",
      name: "Loja",
      enabled: true,
      logo_url: null,
      banner_url: null,
      welcome_message: "Oi",
      theme: null,
      settings: { niche: "nicho-que-nao-existe" },
      qr_codes: null,
      catalog_snapshot: null,
      published_at: null,
    } satisfies DigitalStoreRow;

    expect(mapRowToSettings(row, "Loja").niche).toBe("generic");
  });
});
