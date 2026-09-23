import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CosmoDigitalMenu from "@/features/digital-ordering/menu/components/CosmoDigitalMenu";
import MenuCategoryTabs from "@/features/digital-ordering/menu/components/MenuCategoryTabs";
import { DEFAULT_MENU_THEME } from "@/features/digital-ordering/menu/theme/menuTheme";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { DigitalStoreSettings } from "@/features/digital-ordering/types/digitalStore.types";
import { DEFAULT_DIGITAL_STORE_THEME } from "@/features/digital-ordering/types/digitalStore.types";

function product(overrides: Partial<DigitalMenuProduct> = {}): DigitalMenuProduct {
  return {
    id: "p-1",
    name: "Açaí 500ml",
    basePrice: 20,
    available: true,
    menuKind: "simple",
    imageUrl: null,
    categoryName: "Açaí",
    description: "Tradicional",
    promotionalPrice: null,
    featured: false,
    groups: [],
    ...overrides,
  };
}

function store(
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
    publishedAt: null,
    ...overrides,
  };
}

const catalog = [
  product({ id: "a", name: "Açaí 500ml", categoryName: "Açaí" }),
  product({ id: "b", name: "Copo de morango", categoryName: "Bebidas" }),
];

describe("CosmoDigitalMenu catalogNavigation", () => {
  it("keeps the desktop aside in filter mode", () => {
    const { container } = render(
      <CosmoDigitalMenu
        products={catalog}
        loading={false}
        store={store({ menuFeatures: { catalogNavigation: "filter" } })}
        manageSeo={false}
        onSelectProduct={vi.fn()}
      />
    );

    expect(container.querySelector("[data-catalog-navigation='filter']")).toBeTruthy();
    expect(container.querySelector("[data-menu-category-aside]")).toBeTruthy();
    expect(container.querySelector("[data-menu-section]")).toBeNull();
  });

  it("renders sections without a duplicated desktop aside", () => {
    const { container } = render(
      <CosmoDigitalMenu
        products={catalog}
        loading={false}
        store={store({
          niche: "acai",
          menuTemplateId: "acai",
          menuFeatures: { catalogNavigation: "sections" },
        })}
        manageSeo={false}
        onSelectProduct={vi.fn()}
      />
    );

    expect(container.querySelector("[data-catalog-navigation='sections']")).toBeTruthy();
    expect(container.querySelector("[data-menu-category-aside]")).toBeNull();
    expect(container.querySelector("#menu-category-acai")).toBeTruthy();
    expect(container.querySelector("#menu-category-bebidas")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Açaí" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Bebidas" })).toBeTruthy();
  });

  it("keeps tabs navigable in sections even with few categories", () => {
    render(
      <CosmoDigitalMenu
        products={catalog}
        loading={false}
        store={store({ menuFeatures: { catalogNavigation: "sections" } })}
        manageSeo={false}
        onSelectProduct={vi.fn()}
      />
    );

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(
      expect.arrayContaining([expect.stringContaining("Açaí"), expect.stringContaining("Bebidas")])
    );
    expect(tabs.every((tab) => tab.tagName === "BUTTON")).toBe(true);
  });
});

describe("MenuCategoryTabs a11y", () => {
  it("uses real buttons, aria-selected and keyboard activation", () => {
    const onSelect = vi.fn();
    render(
      <MenuCategoryTabs
        navigation="sections"
        alwaysVisible
        activeCategoryId="acai"
        theme={DEFAULT_MENU_THEME}
        onSelect={onSelect}
        categories={[
          { id: "acai", label: "Açaí", productCount: 1 },
          { id: "bebidas", label: "Bebidas", productCount: 1 },
        ]}
      />
    );

    const acai = screen.getByRole("tab", { name: /Açaí/ });
    const drinks = screen.getByRole("tab", { name: /Bebidas/ });
    expect(acai).toHaveAttribute("aria-selected", "true");
    expect(drinks).toHaveAttribute("aria-selected", "false");

    fireEvent.click(drinks);
    expect(onSelect).toHaveBeenCalledWith("bebidas");

    fireEvent.keyDown(acai, { key: "ArrowRight" });
    expect(onSelect).toHaveBeenCalledWith("bebidas");
  });

  it("points aria-controls at slug-safe section ids", () => {
    render(
      <MenuCategoryTabs
        navigation="sections"
        alwaysVisible
        activeCategoryId="milk-shake"
        theme={DEFAULT_MENU_THEME}
        onSelect={vi.fn()}
        categories={[
          { id: "milk-shake", label: "Milk Shake", productCount: 2 },
          { id: "monte-seu-acai", label: "Monte seu açaí", productCount: 1 },
        ]}
      />
    );

    expect(screen.getByRole("tab", { name: /Milk Shake/ })).toHaveAttribute(
      "aria-controls",
      "menu-category-milk-shake"
    );
    expect(screen.getByRole("tab", { name: /Monte seu açaí/ })).toHaveAttribute(
      "aria-controls",
      "menu-category-monte-seu-acai"
    );
    expect(
      screen.getByRole("tab", { name: /Milk Shake/ }).getAttribute("aria-controls")
    ).not.toContain(" ");
  });
});
