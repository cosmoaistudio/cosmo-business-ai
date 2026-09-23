import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import DigitalProductCard from "@/features/digital-ordering/components/DigitalProductCard";
import DigitalMenuGrid from "@/features/digital-ordering/components/DigitalMenuGrid";
import CosmoDigitalMenu from "@/features/digital-ordering/menu/components/CosmoDigitalMenu";
import { DEFAULT_MENU_THEME } from "@/features/digital-ordering/menu/theme/menuTheme";
import { formatCurrency } from "@/lib/format";
import { resolveMenuTheme } from "@/features/digital-ordering/menu/theme/menuTheme";
import { getNicheConfigForTemplate } from "@/features/digital-ordering/menu/config/nicheConfig";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { DigitalStoreSettings } from "@/features/digital-ordering/types/digitalStore.types";
import { DEFAULT_DIGITAL_STORE_THEME } from "@/features/digital-ordering/types/digitalStore.types";
import type { MenuTheme } from "@/features/digital-ordering/menu/types/digitalMenu.types";

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
    description: "Creme tradicional com granola.",
    promotionalPrice: null,
    featured: false,
    groups: [],
    ...overrides,
  };
}

const group = {
  id: "g-1",
  name: "Adicionais",
  type: "multiple",
  required: false,
  min: 0,
  max: 5,
  maxFree: 0,
  options: [],
};

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

function listTheme(overrides: Partial<MenuTheme> = {}): MenuTheme {
  return {
    ...DEFAULT_MENU_THEME,
    productLayout: "list",
    density: "compact",
    showProductImages: true,
    ...overrides,
  };
}

describe("DigitalProductCard list presentation", () => {
  it("shows a simple price without the from-price prefix", () => {
    render(
      <DigitalProductCard
        product={product()}
        theme={listTheme()}
        variant="list"
        onSelect={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button").querySelector("[data-price-label]")
    ).toHaveAttribute("data-price-label", formatCurrency(27));
    expect(screen.queryByText(/A partir de/)).toBeNull();
  });

  it("prefixes A partir de only for customizable products", () => {
    render(
      <DigitalProductCard
        product={product({ groups: [group] })}
        theme={listTheme()}
        variant="list"
        onSelect={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button").querySelector("[data-price-label]")
    ).toHaveAttribute("data-price-label", `A partir de ${formatCurrency(27)}`);
  });

  it("does not render an image placeholder when the product has no photo", () => {
    const { container } = render(
      <DigitalProductCard
        product={product({ imageUrl: null })}
        theme={listTheme()}
        variant="list"
        onSelect={vi.fn()}
      />
    );

    expect(container.querySelector("[data-has-image='false']")).toBeTruthy();
    expect(container.querySelector("[data-product-image]")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
  });

  it("does not reserve image space when showProductImages is off", () => {
    const { container } = render(
      <DigitalProductCard
        product={product({ imageUrl: "https://cdn.example/acai.webp" })}
        theme={listTheme({ showProductImages: false })}
        variant="list"
        showImage={false}
        onSelect={vi.fn()}
      />
    );

    expect(container.querySelector("[data-has-image='false']")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });

  it("hides the description when showDescriptions is false", () => {
    render(
      <DigitalProductCard
        product={product({ description: "Creme tradicional com granola." })}
        theme={listTheme()}
        variant="list"
        showDescription={false}
        onSelect={vi.fn()}
      />
    );

    expect(screen.queryByText("Creme tradicional com granola.")).toBeNull();
  });

  it("keeps the full description in the DOM and only clamps visually", () => {
    const long =
      "Creme tradicional com granola, leite condensado, leite em pó, morango, kiwi, banana e calda de chocolate artesanal.";
    render(
      <DigitalProductCard
        product={product({ description: long })}
        theme={listTheme()}
        variant="list"
        onSelect={vi.fn()}
      />
    );

    const description = screen.getByText(long);
    expect(description).toHaveClass("line-clamp-2");
    expect(description.textContent).toBe(long);
  });

  it("opens the product sheet via the whole row and has no large add button", () => {
    const onSelect = vi.fn();
    render(
      <DigitalProductCard
        product={product()}
        theme={listTheme({ density: "compact", ctaPosition: "full" })}
        variant="list"
        addLabel="Adicionar"
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Açaí 500ml/ }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Adicionar")).toBeNull();
  });
});

describe("DigitalMenuGrid layout", () => {
  it("renders list as a single column", () => {
    const { container } = render(
      <DigitalMenuGrid
        products={[product({ id: "a" }), product({ id: "b", name: "Copo" })]}
        loading={false}
        theme={listTheme()}
        onSelectProduct={vi.fn()}
      />
    );

    expect(container.querySelector("[data-catalog-layout='list']")).toHaveClass(
      "grid-cols-1"
    );
    expect(container.querySelectorAll("[data-card-variant='list']")).toHaveLength(
      2
    );
  });

  it("keeps the existing grid layout", () => {
    const { container } = render(
      <DigitalMenuGrid
        products={[product({ id: "a" }), product({ id: "b", name: "Copo" })]}
        loading={false}
        theme={{ ...DEFAULT_MENU_THEME, productLayout: "grid" }}
        onSelectProduct={vi.fn()}
      />
    );

    expect(container.querySelector("[data-catalog-layout='grid']")).toBeTruthy();
    expect(container.querySelectorAll("[data-card-variant='grid']")).toHaveLength(
      2
    );
  });

  it("announces an empty search with a live status region", () => {
    render(
      <DigitalMenuGrid
        products={[]}
        loading={false}
        emptyMessage="Nada encontrado. Tente outro termo."
        onSelectProduct={vi.fn()}
      />
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Nada encontrado. Tente outro termo.");
    expect(status).toHaveAttribute("aria-live", "polite");
  });
});

describe("presentation precedence and catalog modes", () => {
  it("lets a store override win over the food template list default", () => {
    const config = getNicheConfigForTemplate("acai", "acai");
    expect(config.theme.productLayout).toBe("list");

    const theme = resolveMenuTheme(DEFAULT_DIGITAL_STORE_THEME, config, {
      productLayout: "grid",
      density: "spacious",
      showProductImages: false,
    });

    expect(theme.productLayout).toBe("grid");
    expect(theme.density).toBe("spacious");
    expect(theme.showProductImages).toBe(false);
  });

  it("keeps sections and filter navigation working with the list card", () => {
    const items = [
      product({ id: "a", name: "Açaí 500ml", categoryName: "Açaí" }),
      product({ id: "b", name: "Água", categoryName: "Bebidas" }),
    ];

    const sections = render(
      <CosmoDigitalMenu
        products={items}
        loading={false}
        store={store({ menuFeatures: { catalogNavigation: "sections" } })}
        manageSeo={false}
        onSelectProduct={vi.fn()}
      />
    );
    expect(
      sections.container.querySelector("[data-catalog-navigation='sections']")
    ).toBeTruthy();
    expect(sections.container.querySelector("#menu-category-acai")).toBeTruthy();
    sections.unmount();

    const filtered = render(
      <CosmoDigitalMenu
        products={items}
        loading={false}
        store={store({
          menuTemplateId: "generic",
          niche: "generic",
          menuFeatures: { catalogNavigation: "filter" },
          menuTheme: { productLayout: "grid" },
        })}
        manageSeo={false}
        onSelectProduct={vi.fn()}
      />
    );
    expect(
      filtered.container.querySelector("[data-catalog-navigation='filter']")
    ).toBeTruthy();
    expect(filtered.container.querySelector("[data-menu-category-aside]")).toBeTruthy();
  });

  it("uses slug-safe category anchors for labels with spaces and accents", () => {
    const items = [
      product({ id: "a", name: "Milk Shake de morango", categoryName: "Milk Shake" }),
      product({ id: "b", name: "Barca especial", categoryName: "Monte seu açaí" }),
    ];

    const { container } = render(
      <CosmoDigitalMenu
        products={items}
        loading={false}
        store={store({ menuFeatures: { catalogNavigation: "sections" } })}
        manageSeo={false}
        onSelectProduct={vi.fn()}
      />
    );

    expect(container.querySelector("#menu-category-milk-shake")).toBeTruthy();
    expect(container.querySelector("#menu-category-monte-seu-acai")).toBeTruthy();
    expect(container.querySelector("#menu-category-milk shake")).toBeNull();
    expect(
      screen.getByRole("tab", { name: /Milk Shake/ }).getAttribute("aria-controls")
    ).toBe("menu-category-milk-shake");
  });

  it("keeps filter mode free of section anchors and announces empty search", () => {
    const items = [
      product({
        id: "a",
        name: "Açaí 500ml",
        categoryName: "Açaí",
        featured: true,
      }),
      product({ id: "b", name: "Água", categoryName: "Bebidas" }),
    ];

    const { container, rerender } = render(
      <CosmoDigitalMenu
        products={items}
        loading={false}
        store={store({
          menuTemplateId: "generic",
          niche: "generic",
          menuFeatures: { catalogNavigation: "filter", showHighlights: true },
        })}
        manageSeo={false}
        onSelectProduct={vi.fn()}
      />
    );

    expect(container.querySelector("[data-catalog-navigation='filter']")).toBeTruthy();
    expect(container.querySelector("#menu-featured")).toBeNull();
    expect(container.querySelector("#menu-category-acai")).toBeNull();

    rerender(
      <CosmoDigitalMenu
        products={items}
        loading={false}
        store={store({
          menuTemplateId: "generic",
          niche: "generic",
          menuFeatures: { catalogNavigation: "filter" },
        })}
        manageSeo={false}
        onSelectProduct={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/buscar/i), {
      target: { value: "xyz-nao-existe" },
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Nada encontrado. Tente outro termo."
    );
  });
});
