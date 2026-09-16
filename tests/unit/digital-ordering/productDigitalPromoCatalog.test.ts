import { beforeEach, describe, expect, it } from "vitest";
import { createCartItem, createProduct } from "../../fixtures/cart";
import { mapProductToEngineNode } from "@/features/product-engine/adapters/compositionAdapter";
import { productPricingEngine } from "@/features/product-engine/engines/ProductPricingEngine";
import { toDigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import {
  loadCatalogSnapshot,
  saveDigitalMenuSnapshot,
} from "@/features/digital-ordering/utils/catalogSnapshot";
import { digitalMenuExtrasFromProduct } from "@/features/digital-ordering/utils/digitalMenuProductExtras";
import { settingsToUpsertPayload } from "@/features/digital-ordering/utils/digitalStoreMappers";
import { DEFAULT_DIGITAL_PAYMENT_SETTINGS } from "@/features/digital-ordering/types/digitalPayment.types";
import {
  DEFAULT_DIGITAL_STORE_THEME,
  type DigitalStoreSettings,
} from "@/features/digital-ordering/types/digitalStore.types";
import { resolveProductPrice } from "@/features/digital-ordering/menu/core/menuCatalog";

function storeSettings(): DigitalStoreSettings {
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
    menuTheme: { cardRadius: "xl", buttonStyle: "outline" },
    acceptsPickup: true,
    acceptsDelivery: true,
    acceptsDineIn: true,
    minimumOrder: 0,
    deliveryFee: 0,
    averagePrepMinutes: 20,
    publishedAt: null,
  };
}

describe("PDV continua usando products.price", () => {
  it("item simples do carrinho cobra price mesmo com promoção e destaque", () => {
    const product = createProduct({
      price: 30,
      promotionalPrice: 25.9,
      featured: true,
    });
    const item = createCartItem({ product });

    expect(item.unitPrice).toBe(30);
    expect(item.unitPrice).not.toBe(product.promotionalPrice);
  });

  it("ProductPricingEngine e o node do PDV ignoram promotionalPrice e featured", () => {
    const product = createProduct({
      price: 30,
      promotionalPrice: 19.9,
      featured: true,
    });
    const node = mapProductToEngineNode({
      product,
      groups: [],
      optionsByGroupId: {},
    });

    expect(node.basePrice).toBe(30);
    expect("promotionalPrice" in node).toBe(false);
    expect("featured" in node).toBe(false);

    const priced = productPricingEngine.calculate(node, {}, 1);
    expect(priced.basePrice).toBe(30);
    expect(priced.total).toBe(30);
  });
});

describe("publishCatalog / catalog_snapshot", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("extras do cardápio levam promoção válida e destaque sem alterar price", () => {
    const product = createProduct({
      price: 30,
      promotionalPrice: 25.9,
      featured: true,
    });
    const extras = digitalMenuExtrasFromProduct(product);

    expect(extras.promotionalPrice).toBe(25.9);
    expect(extras.featured).toBe(true);

    const invalid = digitalMenuExtrasFromProduct(
      createProduct({ price: 30, promotionalPrice: 30, featured: false })
    );
    expect(invalid.promotionalPrice).toBeNull();
    expect(invalid.featured).toBe(false);
  });

  it("snapshot publicado preserva promotionalPrice, featured e basePrice oficial", () => {
    const product = createProduct({
      id: "p-1",
      name: "Pizza Calabresa",
      price: 49.9,
      promotionalPrice: 39.9,
      featured: true,
      category: "Pizzas",
    });
    const extras = digitalMenuExtrasFromProduct(product);
    const snapshot = [
      toDigitalMenuProduct(
        {
          productId: product.id,
          productName: product.name,
          basePrice: Number(product.price),
          status: "active",
          groups: [],
          optionsByGroupId: {},
        },
        extras
      ),
    ];

    expect(snapshot[0].basePrice).toBe(49.9);
    expect(snapshot[0].promotionalPrice).toBe(39.9);
    expect(snapshot[0].featured).toBe(true);
    expect(resolveProductPrice(snapshot[0]).effectivePrice).toBe(39.9);

    const payload = settingsToUpsertPayload(
      storeSettings(),
      DEFAULT_DIGITAL_PAYMENT_SETTINGS,
      [],
      snapshot
    );

    expect(payload.catalog_snapshot).toEqual(snapshot);
    expect(payload.catalog_snapshot?.[0]?.basePrice).toBe(49.9);
    expect(payload.catalog_snapshot?.[0]?.promotionalPrice).toBe(39.9);
    expect(payload.catalog_snapshot?.[0]?.featured).toBe(true);

    saveDigitalMenuSnapshot("org-1", snapshot);
    expect(loadCatalogSnapshot("org-1")).toEqual(snapshot);
  });

  it("produto antigo no snapshot não quebra o catálogo", () => {
    const snapshot = [
      toDigitalMenuProduct({
        productId: "legacy",
        productName: "Suco",
        basePrice: 12,
        status: "active",
        groups: [],
        optionsByGroupId: {},
      }),
    ];

    expect(snapshot[0].promotionalPrice).toBeNull();
    expect(snapshot[0].featured).toBe(false);
    expect(resolveProductPrice(snapshot[0]).effectivePrice).toBe(12);
  });
});
