import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { formatCurrency } from "@/lib/format";
import {
  buildStoreMetaItems,
  hasCustomCatalogCopy,
  isDefaultWelcomeMessage,
} from "@/features/digital-ordering/menu/core/storeMeta";
import { resolveStoreStatus } from "@/features/digital-ordering/menu/core/storeStatus";
import MenuStoreMeta from "@/features/digital-ordering/menu/components/MenuStoreMeta";
import MenuBanner from "@/features/digital-ordering/menu/components/MenuBanner";
import DigitalStoreHeader from "@/features/digital-ordering/components/DigitalStoreHeader";
import CosmoDigitalMenu from "@/features/digital-ordering/menu/components/CosmoDigitalMenu";
import { DEFAULT_MENU_THEME } from "@/features/digital-ordering/menu/theme/menuTheme";
import { DEFAULT_DIGITAL_STORE_SETTINGS } from "@/features/digital-ordering/types/digitalStore.types";
import type { DigitalStoreSettings } from "@/features/digital-ordering/types/digitalStore.types";
import { DEFAULT_DIGITAL_STORE_THEME } from "@/features/digital-ordering/types/digitalStore.types";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";

function store(
  overrides: Partial<DigitalStoreSettings> = {}
): DigitalStoreSettings {
  return {
    slug: "loja-demo",
    organizationId: "org-1",
    organizationName: "Loja Demo",
    logoUrl: null,
    bannerUrl: "https://cdn.example/banner.webp",
    welcomeMessage: "Bem-vindo à casa",
    bannerMessage: "Promo da semana",
    theme: DEFAULT_DIGITAL_STORE_THEME,
    niche: "generic",
    menuTemplateId: "generic",
    menuTheme: {},
    menuCopy: {},
    menuFeatures: {},
    acceptsPickup: true,
    acceptsDelivery: true,
    acceptsDineIn: true,
    minimumOrder: 0,
    deliveryFee: 0,
    averagePrepMinutes: 20,
    publishedAt: "2026-01-01T12:00:00.000Z",
    ...overrides,
  };
}

function product(
  overrides: Partial<DigitalMenuProduct> = {}
): DigitalMenuProduct {
  return {
    id: "p-1",
    name: "Açaí 500ml",
    basePrice: 27,
    available: true,
    menuKind: "simple",
    imageUrl: null,
    categoryName: "Açaí",
    description: null,
    promotionalPrice: null,
    featured: false,
    groups: [],
    ...overrides,
  };
}

describe("buildStoreMetaItems", () => {
  it("shows ETA from averagePrepMinutes and never invents a range", () => {
    const open = resolveStoreStatus(store({ averagePrepMinutes: 25 }), "delivery");
    const items = buildStoreMetaItems(
      store({ averagePrepMinutes: 25 }),
      "delivery",
      open
    );

    expect(open.availability).toBe("open");
    expect(items.find((item) => item.id === "eta")).toEqual({
      id: "eta",
      label: "Delivery",
      value: "~25 min",
    });
    expect(items.find((item) => item.id === "eta")?.value).not.toMatch(/–|-/);
  });

  it("omits ETA when prep time is absent", () => {
    const status = resolveStoreStatus(
      store({ averagePrepMinutes: 0 }),
      "pickup"
    );
    const items = buildStoreMetaItems(
      store({ averagePrepMinutes: 0 }),
      "pickup",
      status
    );

    expect(items.some((item) => item.id === "eta")).toBe(false);
  });

  it("shows minimum order only when it is greater than zero", () => {
    expect(
      buildStoreMetaItems(store({ minimumOrder: 20 }), "pickup").find(
        (item) => item.id === "minimum"
      )
    ).toEqual({
      id: "minimum",
      label: "Pedido mínimo",
      value: formatCurrency(20),
    });
    expect(
      buildStoreMetaItems(store({ minimumOrder: 0 }), "pickup").some(
        (item) => item.id === "minimum"
      )
    ).toBe(false);
  });

  it("never invents opening hours", () => {
    const items = buildStoreMetaItems(store(), "pickup");
    expect(items.some((item) => item.id === "hours")).toBe(false);
    expect(JSON.stringify(items)).not.toMatch(/22:00|Abre às/);
  });
});

describe("MenuStoreMeta", () => {
  it("renders open status with ETA and minimum order", () => {
    const settings = store({ averagePrepMinutes: 20, minimumOrder: 20 });
    const status = resolveStoreStatus(settings, "pickup");

    render(
      <MenuStoreMeta
        store={settings}
        mode="pickup"
        status={status}
        theme={DEFAULT_MENU_THEME}
      />
    );

    expect(screen.getByText("Aceitando pedidos")).toBeInTheDocument();
    expect(screen.getByText("~20 min")).toBeInTheDocument();
    expect(
      document.querySelector("[data-store-meta='minimum']")?.textContent
    ).toMatch(/20,00/);
  });

  it("renders a closed/unpublished status without inventing schedule copy", () => {
    const settings = store({ publishedAt: null });
    const status = resolveStoreStatus(settings, "pickup");

    render(
      <MenuStoreMeta
        store={settings}
        mode="pickup"
        status={status}
        theme={DEFAULT_MENU_THEME}
      />
    );

    expect(screen.getByText("Loja em configuração")).toBeInTheDocument();
    expect(screen.queryByText(/Abre às/)).toBeNull();
    expect(screen.queryByText(/Hoje até/)).toBeNull();
  });
});

describe("MenuBanner presentation", () => {
  it("renders nothing when the banner is hidden", () => {
    const { container } = render(
      <MenuBanner
        imageUrl="https://cdn.example/banner.webp"
        message="Promo"
        storeName="Loja"
        theme={{ ...DEFAULT_MENU_THEME, bannerStyle: "hidden" }}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders a compact image banner", () => {
    const { container } = render(
      <MenuBanner
        imageUrl="https://cdn.example/banner.webp"
        message="Promo"
        storeName="Loja"
        theme={{
          ...DEFAULT_MENU_THEME,
          bannerStyle: "image",
          bannerHeight: "sm",
        }}
      />
    );

    expect(container.querySelector("[data-banner-style='image']")).toBeTruthy();
    expect(container.querySelector("[data-banner-height='sm']")).toBeTruthy();
    expect(container.querySelector("[data-banner-height='sm'] img")).toHaveClass(
      "h-16"
    );
  });

  it("keeps the existing gradient/normal banner", () => {
    const { container } = render(
      <MenuBanner
        imageUrl={null}
        message={null}
        storeName="Loja"
        theme={{
          ...DEFAULT_MENU_THEME,
          bannerStyle: "gradient",
          bannerHeight: "md",
        }}
      />
    );

    expect(container.querySelector("[data-banner-style='gradient']")).toBeTruthy();
    expect(container.querySelector("[data-banner-height='md']")).toBeTruthy();
    expect(
      container.querySelector("[data-banner-height='md'] > div")
    ).toHaveClass("h-36");
  });
});

describe("catalog chrome", () => {
  it("preserves custom catalog copy and hides generic default titles", () => {
    expect(hasCustomCatalogCopy(store({ menuCopy: {} }))).toBe(false);
    expect(
      hasCustomCatalogCopy(
        store({ menuCopy: { catalogTitle: "Açaí da casa" } })
      )
    ).toBe(true);
    expect(
      isDefaultWelcomeMessage(DEFAULT_DIGITAL_STORE_SETTINGS.welcomeMessage)
    ).toBe(true);
    expect(isDefaultWelcomeMessage("Bem-vindo à casa")).toBe(false);

    render(
      <CosmoDigitalMenu
        products={[
          product({ id: "a", categoryName: "Açaí" }),
          product({ id: "b", name: "Água", categoryName: "Bebidas" }),
        ]}
        loading={false}
        store={store({
          niche: "acai",
          menuTemplateId: "acai",
          menuCopy: { catalogTitle: "Açaí da casa" },
          menuFeatures: { catalogNavigation: "sections" },
        })}
        manageSeo={false}
        onSelectProduct={() => undefined}
      />
    );

    expect(screen.getByRole("heading", { name: "Açaí da casa" })).toBeInTheDocument();
  });

  it("uses tabs then search in sections mode", () => {
    const { container } = render(
      <CosmoDigitalMenu
        products={[
          product({ id: "a", categoryName: "Açaí" }),
          product({ id: "b", name: "Água", categoryName: "Bebidas" }),
        ]}
        loading={false}
        store={store({
          niche: "acai",
          menuTemplateId: "acai",
          menuFeatures: { catalogNavigation: "sections" },
        })}
        manageSeo={false}
        onSelectProduct={() => undefined}
      />
    );

    const tabs = container.querySelector("[data-menu-category-tabs]");
    const search = container.querySelector('input[type="search"], [role="search"]');
    const section = container.querySelector("[data-menu-section]");
    expect(tabs).toBeTruthy();
    expect(search).toBeTruthy();
    expect(section).toBeTruthy();
    expect(
      tabs!.compareDocumentPosition(search!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      search!.compareDocumentPosition(section!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(container.querySelector("[data-menu-category-aside]")).toBeNull();
    expect(tabs!.parentElement).toHaveClass("contents");
  });

  it("keeps search before mobile tabs in filter mode", () => {
    const { container } = render(
      <CosmoDigitalMenu
        products={[
          product({ id: "a", categoryName: "Açaí" }),
          product({ id: "b", name: "Água", categoryName: "Bebidas" }),
        ]}
        loading={false}
        store={store({
          menuFeatures: { catalogNavigation: "filter" },
          menuTheme: { productLayout: "grid" },
        })}
        manageSeo={false}
        onSelectProduct={() => undefined}
      />
    );

    expect(container.querySelector("[data-catalog-navigation='filter']")).toBeTruthy();
    const search = container.querySelector("input");
    const tabs = container.querySelector("[data-menu-category-tabs]");
    expect(search).toBeTruthy();
    expect(tabs).toBeTruthy();
    expect(
      search!.compareDocumentPosition(tabs!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});

describe("DigitalStoreHeader compactness", () => {
  it("renders identity, status and meta without overflowing the row", () => {
    const { container } = render(
      <DigitalStoreHeader
        store={store({ minimumOrder: 20, averagePrepMinutes: 15 })}
        mode="delivery"
      />
    );

    expect(container.querySelector("header")).toHaveClass("min-w-0", {
      exact: false,
    });
    expect(screen.getByRole("heading", { name: "Loja Demo" })).toBeInTheDocument();
    expect(container.querySelector("[data-menu-store-meta]")).toBeTruthy();
    expect(container.querySelector("[data-store-channel]")?.textContent).toContain(
      "Delivery"
    );
    expect(container.querySelector("header [data-banner-style]")).toBeNull();
    expect(container.querySelector("[data-banner-style]")).toBeTruthy();
  });

  it("hides a default welcome and a hidden banner", () => {
    const { container } = render(
      <DigitalStoreHeader
        store={store({
          welcomeMessage: DEFAULT_DIGITAL_STORE_SETTINGS.welcomeMessage,
          menuTheme: { bannerStyle: "hidden" },
        })}
        mode="pickup"
      />
    );

    expect(
      screen.queryByText(DEFAULT_DIGITAL_STORE_SETTINGS.welcomeMessage)
    ).toBeNull();
    expect(container.querySelector("[data-banner-style]")).toBeNull();
  });
});
