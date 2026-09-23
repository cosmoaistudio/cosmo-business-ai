import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CosmoDigitalMenu from "@/features/digital-ordering/menu/components/CosmoDigitalMenu";
import MenuEditorPreview from "@/features/digital-ordering/menu/admin/editor/MenuEditorPreview";
import { MenuPreviewSelectProvider } from "@/features/digital-ordering/menu/admin/editor/MenuPreviewSelectContext";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { DigitalStoreSettings } from "@/features/digital-ordering/types/digitalStore.types";
import { DEFAULT_DIGITAL_STORE_THEME } from "@/features/digital-ordering/types/digitalStore.types";
import { FEATURED_SECTION_ANCHOR_ID } from "@/features/digital-ordering/menu/core/menuSectionNav";

function product(
  overrides: Partial<DigitalMenuProduct> = {}
): DigitalMenuProduct {
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

const catalog = [
  product({
    id: "a",
    name: "Açaí 500ml",
    categoryName: "Açaí",
    featured: true,
  }),
  product({ id: "b", name: "Água", categoryName: "Bebidas" }),
];

describe("MenuFeaturedSection in sections mode", () => {
  it("renders featured before category sections when there are highlights", () => {
    const { container } = render(
      <CosmoDigitalMenu
        products={catalog}
        loading={false}
        store={store({ menuFeatures: { catalogNavigation: "sections" } })}
        manageSeo={false}
        onSelectProduct={vi.fn()}
      />
    );

    const featured = container.querySelector("[data-menu-featured]");
    const category = container.querySelector("[data-menu-section='acai']");
    expect(featured).toBeTruthy();
    expect(featured?.id).toBe(FEATURED_SECTION_ANCHOR_ID);
    expect(container.querySelector("#menu-featured")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Mais pedidos" })).toBeTruthy();
    expect(
      featured!.compareDocumentPosition(category!) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(container.querySelector("[data-menu-highlights='carousel']")).toBeNull();
    expect(
      featured?.querySelector("[data-catalog-layout='list']")
    ).toBeTruthy();
  });

  it("hides featured when showHighlights is false", () => {
    const { container } = render(
      <CosmoDigitalMenu
        products={catalog}
        loading={false}
        store={store({
          menuFeatures: { catalogNavigation: "sections", showHighlights: false },
        })}
        manageSeo={false}
        onSelectProduct={vi.fn()}
      />
    );

    expect(container.querySelector("[data-menu-featured]")).toBeNull();
    expect(container.querySelector("#menu-featured")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Mais pedidos" })).toBeNull();
  });

  it("does not render an empty featured section without highlighted products", () => {
    const { container } = render(
      <CosmoDigitalMenu
        products={[
          product({ id: "a", name: "Açaí 500ml", categoryName: "Açaí" }),
          product({ id: "b", name: "Água", categoryName: "Bebidas" }),
        ]}
        loading={false}
        store={store({ menuFeatures: { catalogNavigation: "sections" } })}
        manageSeo={false}
        onSelectProduct={vi.fn()}
      />
    );

    expect(container.querySelector("[data-menu-featured]")).toBeNull();
    expect(container.querySelector("#menu-featured")).toBeNull();
  });

  it("filters featured by the same search as the catalog", () => {
    const { container } = render(
      <CosmoDigitalMenu
        products={catalog}
        loading={false}
        store={store({ menuFeatures: { catalogNavigation: "sections" } })}
        manageSeo={false}
        onSelectProduct={vi.fn()}
      />
    );

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "agua" },
    });

    expect(container.querySelector("[data-menu-featured]")).toBeNull();
    expect(screen.queryByText("Açaí 500ml")).toBeNull();
    expect(screen.getByText("Água")).toBeInTheDocument();
  });

  it("keeps matching featured products after search", () => {
    const { container } = render(
      <CosmoDigitalMenu
        products={catalog}
        loading={false}
        store={store({ menuFeatures: { catalogNavigation: "sections" } })}
        manageSeo={false}
        onSelectProduct={vi.fn()}
      />
    );

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "acai" },
    });

    expect(container.querySelector("[data-menu-featured]")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Mais pedidos" })).toBeTruthy();
    expect(screen.getAllByText("Açaí 500ml").length).toBeGreaterThan(0);
    expect(screen.queryByText("Água")).toBeNull();
  });
});

describe("filter mode highlights", () => {
  it("E: keeps the previous carousel and does not create a featured section", () => {
    const { container } = render(
      <CosmoDigitalMenu
        products={catalog}
        loading={false}
        store={store({
          niche: "generic",
          menuTemplateId: "generic",
          menuFeatures: { catalogNavigation: "filter" },
          menuTheme: { productLayout: "grid" },
        })}
        manageSeo={false}
        onSelectProduct={vi.fn()}
      />
    );

    expect(container.querySelector("[data-catalog-navigation='filter']")).toBeTruthy();
    expect(container.querySelector("[data-menu-featured]")).toBeNull();
    expect(container.querySelector("[data-menu-highlights='carousel']")).toBeTruthy();
    expect(container.querySelector("[data-menu-section]")).toBeNull();
  });
});

describe("featured preview selection", () => {
  it("uses the public menu renderer and remains selectable", () => {
    const onSelect = vi.fn();
    render(
      <MenuPreviewSelectProvider enabled selected={null} onSelect={onSelect}>
        <CosmoDigitalMenu
          products={catalog}
          loading={false}
          store={store({ menuFeatures: { catalogNavigation: "sections" } })}
          manageSeo={false}
          onSelectProduct={vi.fn()}
        />
      </MenuPreviewSelectProvider>
    );

    fireEvent.click(screen.getByRole("group", { name: "Selecionar Destaques" }));
    expect(onSelect).toHaveBeenCalledWith("highlights");
    expect(MenuEditorPreview).toBeTypeOf("function");
  });
});
