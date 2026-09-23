export const MENU_SECTION_ID_PREFIX = "menu-category-";
export const FEATURED_SECTION_ID = "featured";
export const FEATURED_SECTION_ANCHOR_ID = "menu-featured";

/**
 * Real categories whose normalized id would be `featured` get this instead.
 * Featured itself never goes through sanitizeCategorySectionId.
 */
export const FEATURED_CATEGORY_FALLBACK_ID = "__featured_category__";

/**
 * Safe fragment for HTML id / aria-controls. Spaces, accents and punctuation
 * become hyphens so "Milk Shake" never yields `menu-category-milk shake`.
 */
export function slugifyCategorySectionId(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function sanitizeCategorySectionId(categoryId: string): string {
  if (
    categoryId === FEATURED_CATEGORY_FALLBACK_ID ||
    categoryId.startsWith("__")
  ) {
    return categoryId;
  }
  if (categoryId === FEATURED_SECTION_ID) return FEATURED_CATEGORY_FALLBACK_ID;

  const slug = slugifyCategorySectionId(categoryId);
  if (slug === FEATURED_SECTION_ID) return FEATURED_CATEGORY_FALLBACK_ID;
  return slug.length > 0 ? slug : categoryId;
}

export function menuSectionAnchorId(categoryId: string): string {
  if (categoryId === FEATURED_SECTION_ID) return FEATURED_SECTION_ANCHOR_ID;
  return `${MENU_SECTION_ID_PREFIX}${sanitizeCategorySectionId(categoryId)}`;
}

export function isMenuScrollElement(
  node: EventTarget | null | undefined
): node is HTMLElement {
  return node instanceof HTMLElement;
}

/**
 * Prefer an explicit preview/canvas container. Otherwise walk ancestors for
 * overflow scroll (editor frames) and only then fall back to the window.
 */
export function resolveMenuScrollContainer(
  start: HTMLElement | null | undefined,
  explicit?: HTMLElement | null
): HTMLElement | Window {
  if (explicit) return explicit;

  let node = start?.parentElement ?? null;
  while (node) {
    if (node.dataset.menuPreview === "true") return node;

    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    const canScroll =
      overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";
    if (canScroll && node.scrollHeight > node.clientHeight + 1) {
      return node;
    }

    node = node.parentElement;
  }

  return window;
}

export function readElementScale(element: HTMLElement): number {
  const height = element.offsetHeight;
  if (height <= 0) return 1;
  const visual = element.getBoundingClientRect().height;
  const scale = visual / height;
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
}

export function measureStickyNavOffset(
  container: HTMLElement | Window,
  scale = 1
): number {
  const root = container instanceof HTMLElement ? container : document;
  const header = root.querySelector("header");
  const tabs = root.querySelector("[data-menu-category-tabs]");
  const headerHeight =
    header instanceof HTMLElement ? header.getBoundingClientRect().height : 0;
  const tabsHeight =
    tabs instanceof HTMLElement ? tabs.getBoundingClientRect().height : 0;
  const safeScale = scale > 0 ? scale : 1;

  return (headerHeight + tabsHeight) / safeScale + 8;
}

export function computeSectionScrollTop(
  section: HTMLElement,
  container: HTMLElement | Window,
  offset: number
): number {
  if (!(container instanceof HTMLElement)) {
    return window.scrollY + section.getBoundingClientRect().top - offset;
  }

  const scale = readElementScale(container);
  const visualDelta =
    section.getBoundingClientRect().top - container.getBoundingClientRect().top;

  return container.scrollTop + visualDelta / scale - offset;
}

/**
 * Last section whose top has crossed the activation line.
 *
 * After a programmatic tab click the destination often parks a few pixels
 * *below* the marker (preview scale / sticky offset). The previous section
 * is then still the last one that crossed, even if it has already left the
 * visible scroller. `viewportTop` promotes the first section still in view.
 */
export function pickActiveMenuSection(
  sections: Array<{ id: string; top: number }>,
  marker: number,
  viewportTop?: number
): string | null {
  if (sections.length === 0) return null;

  let current = sections[0].id;
  for (const section of sections) {
    if (section.top <= marker) current = section.id;
  }

  if (viewportTop == null) return current;

  const picked = sections.find((section) => section.id === current);
  if (!picked || picked.top >= viewportTop) return current;

  return sections.find((section) => section.top >= viewportTop)?.id ?? current;
}

export function measureScrollMarker(
  container: HTMLElement | Window,
  offset: number
): number {
  if (!(container instanceof HTMLElement)) return offset;
  return container.getBoundingClientRect().top + offset * readElementScale(container);
}
