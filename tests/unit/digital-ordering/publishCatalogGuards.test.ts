import { describe, expect, it } from "vitest";
import {
  shouldOmitCatalogSnapshotFromUpsert,
  validatePersistedCatalogSnapshot,
} from "@/features/digital-ordering/utils/publishCatalogGuards";
import { settingsToUpsertPayload } from "@/features/digital-ordering/utils/digitalStoreMappers";
import { DEFAULT_DIGITAL_PAYMENT_SETTINGS } from "@/features/digital-ordering/types/digitalPayment.types";
import {
  DEFAULT_DIGITAL_STORE_THEME,
  type DigitalStoreSettings,
} from "@/features/digital-ordering/types/digitalStore.types";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";

const products: DigitalMenuProduct[] = [
  {
    id: "p1",
    name: "Açaí 300 ML",
    basePrice: 11.9,
    available: true,
    promotionalPrice: 9.9,
    featured: true,
    categoryName: "Açaí",
    description: null,
    imageUrl: null,
    groups: [],
  },
  {
    id: "p2",
    name: "Açaí 500 ML",
    basePrice: 14.9,
    available: true,
    promotionalPrice: null,
    featured: false,
    categoryName: "Açaí",
    description: null,
    imageUrl: null,
    groups: [],
  },
];

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
    acceptsPickup: true,
    acceptsDelivery: true,
    acceptsDineIn: true,
    minimumOrder: 0,
    deliveryFee: 0,
    averagePrepMinutes: 20,
    publishedAt: "2026-08-13T22:26:47.630Z",
    ...overrides,
  };
}

describe("validatePersistedCatalogSnapshot", () => {
  it("returns the persisted products when store identity matches", () => {
    const saved = validatePersistedCatalogSnapshot({
      expectedProductCount: 2,
      expectedSlug: "cosmo-business",
      expectedOrganizationId: "org-1",
      persisted: {
        id: "store-1",
        slug: "cosmo-business",
        organization_id: "org-1",
        catalog_snapshot: products,
        published_at: "2026-09-16T18:00:00.000Z",
      },
    });

    expect(saved).toHaveLength(2);
    expect(saved[0]?.name).toBe("Açaí 300 ML");
    expect(saved[0]?.promotionalPrice).toBe(9.9);
  });

  it("fails when 0 rows were updated (null returning)", () => {
    expect(() =>
      validatePersistedCatalogSnapshot({
        expectedProductCount: 2,
        expectedSlug: "cosmo-business",
        persisted: null,
      })
    ).toThrow(/nenhuma loja digital foi atualizada/i);
  });

  it("fails when slug diverges from the public menu identity", () => {
    expect(() =>
      validatePersistedCatalogSnapshot({
        expectedProductCount: 2,
        expectedSlug: "cosmo-business",
        expectedOrganizationId: "org-1",
        persisted: {
          id: "store-1",
          slug: "outra-loja",
          organization_id: "org-1",
          catalog_snapshot: products,
          published_at: "2026-09-16T18:00:00.000Z",
        },
      })
    ).toThrow(/slug/i);
  });

  it("fails when organization_id diverges", () => {
    expect(() =>
      validatePersistedCatalogSnapshot({
        expectedProductCount: 2,
        expectedSlug: "cosmo-business",
        expectedOrganizationId: "org-1",
        persisted: {
          id: "store-1",
          slug: "cosmo-business",
          organization_id: "org-OTHER",
          catalog_snapshot: products,
          published_at: "2026-09-16T18:00:00.000Z",
        },
      })
    ).toThrow(/organização/i);
  });

  it("fails when persisted snapshot is empty", () => {
    expect(() =>
      validatePersistedCatalogSnapshot({
        expectedProductCount: 2,
        expectedSlug: "cosmo-business",
        persisted: {
          id: "store-1",
          slug: "cosmo-business",
          organization_id: "org-1",
          catalog_snapshot: [],
          published_at: "2026-09-16T18:00:00.000Z",
        },
      })
    ).toThrow(/vazio/i);
  });

  it("fails when product counts diverge", () => {
    expect(() =>
      validatePersistedCatalogSnapshot({
        expectedProductCount: 7,
        expectedSlug: "cosmo-business",
        persisted: {
          id: "store-1",
          slug: "cosmo-business",
          catalog_snapshot: products,
          published_at: "2026-09-16T18:00:00.000Z",
        },
      })
    ).toThrow(/incompleta/i);
  });

  it("fails when published_at is missing", () => {
    expect(() =>
      validatePersistedCatalogSnapshot({
        expectedProductCount: 2,
        expectedSlug: "cosmo-business",
        persisted: {
          id: "store-1",
          slug: "cosmo-business",
          catalog_snapshot: products,
          published_at: null,
        },
      })
    ).toThrow(/published_at/i);
  });
});

describe("publishedAt upsert must not wipe catalog_snapshot", () => {
  it("omits catalog_snapshot when undefined so saveSettings cannot clear the menu", () => {
    expect(shouldOmitCatalogSnapshotFromUpsert(undefined)).toBe(true);

    const payload = settingsToUpsertPayload(
      storeSettings({ publishedAt: new Date().toISOString() }),
      DEFAULT_DIGITAL_PAYMENT_SETTINGS,
      []
      // catalogSnapshot intentionally omitted
    );

    expect("catalog_snapshot" in payload).toBe(false);
    expect(payload.slug).toBe("cosmo-business");
  });

  it("still writes an explicit snapshot when provided for publish paths", () => {
    expect(shouldOmitCatalogSnapshotFromUpsert(products)).toBe(false);

    const payload = settingsToUpsertPayload(
      storeSettings(),
      DEFAULT_DIGITAL_PAYMENT_SETTINGS,
      [],
      products
    );

    expect(payload.catalog_snapshot).toHaveLength(2);
  });
});
