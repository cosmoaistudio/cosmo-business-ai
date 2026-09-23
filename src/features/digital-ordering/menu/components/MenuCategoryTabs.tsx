import { useCallback, useEffect, useRef, useState } from "react";
import type {
  MenuCatalogNavigation,
  MenuCategory,
  MenuTheme,
} from "../types/digitalMenu.types";
import { radiusToCss } from "../theme/menuTheme";
import { menuSectionAnchorId } from "../core/menuSectionNav";

interface MenuCategoryTabsProps {
  categories: MenuCategory[];
  activeCategoryId: string;
  theme: MenuTheme;
  onSelect: (categoryId: string) => void;
  navigation?: MenuCatalogNavigation;
  /** Sections mode: keep the strip visible whenever there is a navigable group. */
  alwaysVisible?: boolean;
}

export default function MenuCategoryTabs({
  categories,
  activeCategoryId,
  theme,
  onSelect,
  navigation = "filter",
  alwaysVisible = false,
}: MenuCategoryTabsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isSections = navigation === "sections" || alwaysVisible;
  const showTabs = isSections ? categories.length > 0 : categories.length > 2;

  const updateOverflow = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    if (!showTabs) return;
    updateOverflow();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateOverflow, { passive: true });
    window.addEventListener("resize", updateOverflow);
    return () => {
      el.removeEventListener("scroll", updateOverflow);
      window.removeEventListener("resize", updateOverflow);
    };
  }, [showTabs, categories.length, updateOverflow]);

  useEffect(() => {
    if (!showTabs) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const active = scroller.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!active) return;
    const left = Math.max(
      0,
      active.offsetLeft - scroller.clientWidth / 2 + active.clientWidth / 2
    );
    if (typeof scroller.scrollTo === "function") {
      scroller.scrollTo({ left, behavior: "smooth" });
      return;
    }
    scroller.scrollLeft = left;
  }, [activeCategoryId, showTabs]);

  if (!showTabs) return null;

  const focusTab = (categoryId: string) => {
    const scroller = scrollerRef.current;
    const button = scroller?.querySelector<HTMLButtonElement>(
      `[data-category-id="${categoryId}"]`
    );
    button?.focus();
  };

  const moveSelection = (direction: 1 | -1) => {
    const index = categories.findIndex((entry) => entry.id === activeCategoryId);
    const nextIndex =
      (index + direction + categories.length) % categories.length;
    const next = categories[nextIndex];
    if (!next) return;
    onSelect(next.id);
    focusTab(next.id);
  };

  return (
    <nav
      aria-label="Categorias do cardápio"
      data-menu-category-tabs=""
      data-catalog-navigation={navigation}
      className="sticky top-[var(--digital-header-offset,4.5rem)] z-20 -mx-4 sm:mx-0"
      style={{
        backgroundColor: `color-mix(in srgb, ${theme.backgroundColor} 88%, transparent)`,
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="relative">
        {canScrollLeft ? (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8"
            style={{
              background: `linear-gradient(to right, ${theme.backgroundColor}, transparent)`,
            }}
            aria-hidden
          />
        ) : null}
        {canScrollRight ? (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8"
            style={{
              background: `linear-gradient(to left, ${theme.backgroundColor}, transparent)`,
            }}
            aria-hidden
          />
        ) : null}

        <div
          ref={scrollerRef}
          className="overflow-x-auto px-4 py-2 [scrollbar-width:none] sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          <ul
            className="flex w-max gap-1.5"
            role="tablist"
            aria-label="Categorias"
          >
            {categories.map((category) => {
              const active = category.id === activeCategoryId;

              return (
                <li key={category.id} role="presentation">
                  <button
                    type="button"
                    role="tab"
                    data-category-id={category.id}
                    aria-selected={active}
                    aria-controls={
                      isSections ? menuSectionAnchorId(category.id) : undefined
                    }
                    tabIndex={active ? 0 : -1}
                    onClick={() => onSelect(category.id)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowRight") {
                        event.preventDefault();
                        moveSelection(1);
                      } else if (event.key === "ArrowLeft") {
                        event.preventDefault();
                        moveSelection(-1);
                      }
                    }}
                    className="digital-focus-ring digital-motion-press relative whitespace-nowrap px-4 py-2.5 text-sm font-semibold"
                    style={{
                      borderRadius: radiusToCss(theme.buttonRadius),
                      backgroundColor: active
                        ? theme.primaryColor
                        : "transparent",
                      color: active ? "#ffffff" : theme.mutedTextColor,
                    }}
                  >
                    {category.label}
                    <span
                      className="ml-1.5 text-[11px] font-medium opacity-75"
                      style={{
                        color: active ? "#ffffff" : theme.mutedTextColor,
                      }}
                    >
                      {category.productCount}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
