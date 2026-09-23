import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FEATURED_CATEGORY_FALLBACK_ID,
  FEATURED_SECTION_ANCHOR_ID,
  FEATURED_SECTION_ID,
  computeSectionScrollTop,
  menuSectionAnchorId,
  pickActiveMenuSection,
  resolveMenuScrollContainer,
  sanitizeCategorySectionId,
} from "@/features/digital-ordering/menu/core/menuSectionNav";
import { useMenuSectionNav } from "@/features/digital-ordering/menu/hooks/useMenuSectionNav";

function mountPreview(ids: string[]) {
  const preview = document.createElement("div");
  preview.dataset.menuPreview = "true";
  Object.defineProperty(preview, "scrollHeight", { value: 2000, configurable: true });
  Object.defineProperty(preview, "clientHeight", { value: 400, configurable: true });
  preview.style.overflowY = "auto";
  preview.getBoundingClientRect = () =>
    ({
      top: 40,
      bottom: 440,
      left: 0,
      right: 390,
      width: 390,
      height: 400,
      x: 0,
      y: 40,
      toJSON: () => ({}),
    }) as DOMRect;

  const header = document.createElement("header");
  header.getBoundingClientRect = () =>
    ({
      top: 40,
      height: 64,
      bottom: 104,
      left: 0,
      right: 390,
      width: 390,
      x: 0,
      y: 40,
      toJSON: () => ({}),
    }) as DOMRect;

  const tabs = document.createElement("nav");
  tabs.setAttribute("data-menu-category-tabs", "");
  tabs.getBoundingClientRect = () =>
    ({
      top: 104,
      height: 48,
      bottom: 152,
      left: 0,
      right: 390,
      width: 390,
      x: 0,
      y: 104,
      toJSON: () => ({}),
    }) as DOMRect;

  preview.append(header, tabs);

  ids.forEach((id, index) => {
    const section = document.createElement("section");
    section.id = menuSectionAnchorId(id);
    section.getBoundingClientRect = () =>
      ({
        top: 160 + index * 240,
        height: 220,
        bottom: 380 + index * 240,
        left: 0,
        right: 390,
        width: 390,
        x: 0,
        y: 160 + index * 240,
        toJSON: () => ({}),
      }) as DOMRect;
    preview.append(section);
  });

  document.body.append(preview);
  return preview;
}

describe("menuSectionNav helpers", () => {
  it("builds a stable section id", () => {
    expect(menuSectionAnchorId("combos")).toBe("menu-category-combos");
    expect(sanitizeCategorySectionId("combos")).toBe("combos");
    expect(sanitizeCategorySectionId("acai")).toBe("acai");
  });

  it("keeps a stable featured section id", () => {
    expect(FEATURED_SECTION_ID).toBe("featured");
    expect(FEATURED_SECTION_ANCHOR_ID).toBe("menu-featured");
    expect(menuSectionAnchorId("featured")).toBe("menu-featured");
    expect(menuSectionAnchorId(FEATURED_SECTION_ID)).toBe(FEATURED_SECTION_ANCHOR_ID);
    expect(menuSectionAnchorId("featured")).not.toBe("menu-category-featured");
  });

  it("does not let a real category collide with the reserved featured id", () => {
    const remapped = sanitizeCategorySectionId("featured");
    expect(remapped).toBe(FEATURED_CATEGORY_FALLBACK_ID);
    expect(remapped).not.toBe(FEATURED_SECTION_ID);
    expect(menuSectionAnchorId(remapped)).toBe(
      `menu-category-${FEATURED_CATEGORY_FALLBACK_ID}`
    );
    expect(menuSectionAnchorId(remapped)).not.toBe(FEATURED_SECTION_ANCHOR_ID);
    expect(menuSectionAnchorId(remapped)).not.toBe(menuSectionAnchorId("featured"));
  });

  it("does not generate the same anchor for two different category ids", () => {
    const anchors = [
      menuSectionAnchorId("acai"),
      menuSectionAnchorId("bebidas"),
      menuSectionAnchorId(sanitizeCategorySectionId("featured")),
      menuSectionAnchorId(FEATURED_SECTION_ID),
    ];
    expect(new Set(anchors).size).toBe(4);
  });

  it("picks the last section whose top has crossed the marker", () => {
    expect(
      pickActiveMenuSection(
        [
          { id: "acai", top: 20 },
          { id: "bebidas", top: 180 },
        ],
        120
      )
    ).toBe("acai");
    expect(
      pickActiveMenuSection(
        [
          { id: "acai", top: 20 },
          { id: "bebidas", top: 90 },
        ],
        120
      )
    ).toBe("bebidas");
  });

  it("does not keep a section that has left the scroller when the next one is in view", () => {
    // QA 5.3 preview: Featured scrolled above the canvas, Combos parked just below the marker.
    expect(
      pickActiveMenuSection(
        [
          { id: "featured", top: 123 },
          { id: "combos", top: 261 },
          { id: "barcas", top: 480 },
        ],
        251,
        211
      )
    ).toBe("combos");
  });

  it("keeps Featured when it is still inside the scroller", () => {
    expect(
      pickActiveMenuSection(
        [
          { id: "featured", top: 243 },
          { id: "combos", top: 400 },
        ],
        251,
        211
      )
    ).toBe("featured");
  });

  it("activates only the category still inside the scroller", () => {
    expect(
      pickActiveMenuSection(
        [
          { id: "featured", top: 40 },
          { id: "combos", top: 80 },
          { id: "barcas", top: 230 },
        ],
        251,
        211
      )
    ).toBe("barcas");
  });

  it("prefers the preview canvas over window", () => {
    const preview = document.createElement("div");
    preview.dataset.menuPreview = "true";
    const child = document.createElement("div");
    preview.append(child);
    document.body.append(preview);

    expect(resolveMenuScrollContainer(child)).toBe(preview);
    expect(resolveMenuScrollContainer(child, preview)).toBe(preview);

    preview.remove();
  });

  it("computes scrollTop inside a nested container, not the window", () => {
    const container = document.createElement("div");
    container.scrollTop = 80;
    container.getBoundingClientRect = () =>
      ({
        top: 50,
        height: 400,
        bottom: 450,
        left: 0,
        right: 390,
        width: 390,
        x: 0,
        y: 50,
        toJSON: () => ({}),
      }) as DOMRect;
    Object.defineProperty(container, "offsetHeight", { value: 400 });

    const section = document.createElement("div");
    section.getBoundingClientRect = () =>
      ({
        top: 210,
        height: 200,
        bottom: 410,
        left: 0,
        right: 390,
        width: 390,
        x: 0,
        y: 210,
        toJSON: () => ({}),
      }) as DOMRect;

    expect(computeSectionScrollTop(section, container, 40)).toBe(200);
  });
});

function mountQaPreview() {
  const preview = mountPreview(["featured", "combos", "barcas"]);
  preview.getBoundingClientRect = () =>
    ({
      top: 211,
      bottom: 756,
      left: 0,
      right: 390,
      width: 390,
      height: 545,
      x: 0,
      y: 211,
      toJSON: () => ({}),
    }) as DOMRect;

  const header = preview.querySelector("header");
  if (header) {
    header.getBoundingClientRect = () =>
      ({
        top: 211,
        height: 0,
        bottom: 211,
        left: 0,
        right: 390,
        width: 390,
        x: 0,
        y: 211,
        toJSON: () => ({}),
      }) as DOMRect;
  }

  const tabs = preview.querySelector("[data-menu-category-tabs]");
  if (tabs instanceof HTMLElement) {
    tabs.getBoundingClientRect = () =>
      ({
        top: 211,
        height: 32,
        bottom: 243,
        left: 0,
        right: 390,
        width: 390,
        x: 0,
        y: 211,
        toJSON: () => ({}),
      }) as DOMRect;
  }

  const featured = document.getElementById("menu-featured");
  const combos = document.getElementById("menu-category-combos");
  const barcas = document.getElementById("menu-category-barcas");
  if (featured) {
    featured.getBoundingClientRect = () =>
      ({
        top: 123,
        height: 120,
        bottom: 243,
        left: 0,
        right: 390,
        width: 390,
        x: 0,
        y: 123,
        toJSON: () => ({}),
      }) as DOMRect;
  }
  if (combos) {
    combos.getBoundingClientRect = () =>
      ({
        top: 261,
        height: 180,
        bottom: 441,
        left: 0,
        right: 390,
        width: 390,
        x: 0,
        y: 261,
        toJSON: () => ({}),
      }) as DOMRect;
  }
  if (barcas) {
    barcas.getBoundingClientRect = () =>
      ({
        top: 480,
        height: 180,
        bottom: 660,
        left: 0,
        right: 390,
        width: 390,
        x: 0,
        y: 480,
        toJSON: () => ({}),
      }) as DOMRect;
  }

  return preview;
}

describe("useMenuSectionNav", () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("scrolls the preview container and updates the active section", () => {
    const preview = mountPreview(["featured", "acai", "bebidas"]);
    const scrollTo = vi.fn();
    preview.scrollTo = scrollTo as typeof preview.scrollTo;

    const { result } = renderHook(() =>
      useMenuSectionNav({
        enabled: true,
        sectionIds: ["featured", "acai", "bebidas"],
        scrollContainerRef: { current: preview },
      })
    );

    act(() => {
      result.current.rootRef.current = preview;
      result.current.scrollToSection("bebidas");
    });

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo.mock.calls[0][0]).toEqual(
      expect.objectContaining({ behavior: "smooth" })
    );
    expect(result.current.activeSectionId).toBe("bebidas");
    expect(scrollTo.mock.calls[0][0].top).toBeGreaterThanOrEqual(0);
  });

  it("keeps scroll-spy distinct when a remapped featured category is present", () => {
    const remapped = sanitizeCategorySectionId("featured");
    const preview = mountPreview(["featured", remapped, "acai"]);
    const scrollTo = vi.fn();
    preview.scrollTo = scrollTo as typeof preview.scrollTo;

    expect(document.getElementById("menu-featured")).toBeTruthy();
    expect(document.getElementById(menuSectionAnchorId(remapped))).toBeTruthy();
    expect(document.getElementById(menuSectionAnchorId(remapped))?.id).not.toBe(
      "menu-featured"
    );

    const { result } = renderHook(() =>
      useMenuSectionNav({
        enabled: true,
        sectionIds: ["featured", remapped, "acai"],
        scrollContainerRef: { current: preview },
      })
    );

    act(() => {
      result.current.rootRef.current = preview;
      result.current.scrollToSection(remapped);
    });

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(result.current.activeSectionId).toBe(remapped);
    expect(result.current.activeSectionId).not.toBe("featured");
  });

  it("A: clicking Combos scrolls to #menu-category-combos and keeps Combos active after the spy unlocks", () => {
    vi.useFakeTimers();
    const preview = mountQaPreview();
    const scrollTo = vi.fn();
    preview.scrollTo = scrollTo as typeof preview.scrollTo;

    const { result } = renderHook(() =>
      useMenuSectionNav({
        enabled: true,
        sectionIds: ["featured", "combos", "barcas"],
        scrollContainerRef: { current: preview },
      })
    );

    act(() => {
      result.current.rootRef.current = preview;
      result.current.scrollToSection("combos");
    });

    expect(document.getElementById("menu-category-combos")).toBeTruthy();
    expect(scrollTo).toHaveBeenCalledWith({
      top: expect.any(Number),
      behavior: "smooth",
    });
    expect(result.current.activeSectionId).toBe("combos");

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.activeSectionId).toBe("combos");
  });

  it("B: clicking Featured scrolls to #menu-featured and keeps Featured active", () => {
    vi.useFakeTimers();
    const preview = mountQaPreview();
    const scrollTo = vi.fn();
    preview.scrollTo = scrollTo as typeof preview.scrollTo;

    const featured = document.getElementById("menu-featured");
    if (featured) {
      featured.getBoundingClientRect = () =>
        ({
          top: 243,
          height: 120,
          bottom: 363,
          left: 0,
          right: 390,
          width: 390,
          x: 0,
          y: 243,
          toJSON: () => ({}),
        }) as DOMRect;
    }
    const combos = document.getElementById("menu-category-combos");
    if (combos) {
      combos.getBoundingClientRect = () =>
        ({
          top: 400,
          height: 180,
          bottom: 580,
          left: 0,
          right: 390,
          width: 390,
          x: 0,
          y: 400,
          toJSON: () => ({}),
        }) as DOMRect;
    }

    const { result } = renderHook(() =>
      useMenuSectionNav({
        enabled: true,
        sectionIds: ["featured", "combos", "barcas"],
        scrollContainerRef: { current: preview },
      })
    );

    act(() => {
      result.current.rootRef.current = preview;
      result.current.scrollToSection("featured");
    });

    expect(document.getElementById("menu-featured")).toBeTruthy();
    expect(scrollTo).toHaveBeenCalled();
    expect(result.current.activeSectionId).toBe("featured");

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.activeSectionId).toBe("featured");
  });

  it("C: clicking another category activates only that category", () => {
    const preview = mountQaPreview();
    preview.scrollTo = vi.fn() as typeof preview.scrollTo;

    const { result } = renderHook(() =>
      useMenuSectionNav({
        enabled: true,
        sectionIds: ["featured", "combos", "barcas"],
        scrollContainerRef: { current: preview },
      })
    );

    act(() => {
      result.current.rootRef.current = preview;
      result.current.scrollToSection("barcas");
    });

    expect(result.current.activeSectionId).toBe("barcas");
    expect(result.current.activeSectionId).not.toBe("combos");
    expect(result.current.activeSectionId).not.toBe("featured");
  });

  it("D: scroll-spy updates the active section when the visible section changes", () => {
    const preview = mountQaPreview();
    const featured = document.getElementById("menu-featured");
    const combos = document.getElementById("menu-category-combos");
    if (featured) {
      featured.getBoundingClientRect = () =>
        ({
          top: 243,
          height: 120,
          bottom: 363,
          left: 0,
          right: 390,
          width: 390,
          x: 0,
          y: 243,
          toJSON: () => ({}),
        }) as DOMRect;
    }
    if (combos) {
      combos.getBoundingClientRect = () =>
        ({
          top: 400,
          height: 180,
          bottom: 580,
          left: 0,
          right: 390,
          width: 390,
          x: 0,
          y: 400,
          toJSON: () => ({}),
        }) as DOMRect;
    }

    const { result } = renderHook(() =>
      useMenuSectionNav({
        enabled: true,
        sectionIds: ["featured", "combos", "barcas"],
        scrollContainerRef: { current: preview },
      })
    );

    expect(result.current.activeSectionId).toBe("featured");

    if (featured) {
      featured.getBoundingClientRect = () =>
        ({
          top: 123,
          height: 120,
          bottom: 243,
          left: 0,
          right: 390,
          width: 390,
          x: 0,
          y: 123,
          toJSON: () => ({}),
        }) as DOMRect;
    }
    if (combos) {
      combos.getBoundingClientRect = () =>
        ({
          top: 261,
          height: 180,
          bottom: 441,
          left: 0,
          right: 390,
          width: 390,
          x: 0,
          y: 261,
          toJSON: () => ({}),
        }) as DOMRect;
    }

    act(() => {
      preview.dispatchEvent(new Event("scroll"));
    });

    expect(result.current.activeSectionId).toBe("combos");
  });
});
