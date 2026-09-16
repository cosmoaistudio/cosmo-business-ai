import type { MenuCategory, MenuTheme } from "../types/digitalMenu.types";
import { radiusToCss } from "../theme/menuTheme";

interface MenuCategoryTabsProps {
  categories: MenuCategory[];
  activeCategoryId: string;
  theme: MenuTheme;
  onSelect: (categoryId: string) => void;
}

export default function MenuCategoryTabs({
  categories,
  activeCategoryId,
  theme,
  onSelect,
}: MenuCategoryTabsProps) {
  // A single category plus "Tudo" carries no navigation value.
  if (categories.length <= 2) return null;

  return (
    <nav
      aria-label="Categorias do cardápio"
      // Negative margin lets chips bleed to the screen edge on mobile.
      className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex w-max gap-2 pb-1">
        {categories.map((category) => {
          const active = category.id === activeCategoryId;

          return (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => onSelect(category.id)}
                aria-current={active ? "true" : undefined}
                className="whitespace-nowrap border px-4 py-2 text-sm font-medium transition active:scale-[0.97]"
                style={{
                  borderRadius: radiusToCss(theme.buttonRadius),
                  backgroundColor: active ? theme.primaryColor : theme.surfaceColor,
                  borderColor: active ? theme.primaryColor : theme.borderColor,
                  color: active ? "#ffffff" : theme.textColor,
                }}
              >
                {category.label}
                <span
                  className="ml-2 text-xs opacity-70"
                  style={{ color: active ? "#ffffff" : theme.mutedTextColor }}
                >
                  {category.productCount}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
