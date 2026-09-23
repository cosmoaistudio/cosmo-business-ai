import DigitalMenuGrid from "../../components/DigitalMenuGrid";
import type {
  MenuCatalogSection,
  MenuTheme,
} from "../types/digitalMenu.types";
import type { MenuCardEmphasis } from "../types/menuTemplate.types";
import { headingSizeClass } from "../theme/menuTheme";
import { menuSectionAnchorId } from "../core/menuSectionNav";

interface MenuCategorySectionsProps {
  sections: MenuCatalogSection[];
  loading: boolean;
  theme: MenuTheme;
  emptyMessage: string;
  showDescriptions: boolean;
  showImages: boolean;
  showPopularBadge: boolean;
  showPromotions: boolean;
  cardEmphasis: MenuCardEmphasis;
  addLabel: string;
  customizableLabel: string;
  onSelectProduct: (productId: string) => void;
  onRetry?: () => void;
}

export default function MenuCategorySections({
  sections,
  loading,
  theme,
  emptyMessage,
  showDescriptions,
  showImages,
  showPopularBadge,
  showPromotions,
  cardEmphasis,
  addLabel,
  customizableLabel,
  onSelectProduct,
  onRetry,
}: MenuCategorySectionsProps) {
  const gridProps = {
    loading: false,
    theme,
    showDescriptions,
    showImages,
    showPopularBadge,
    showPromotions,
    cardEmphasis,
    addLabel,
    customizableLabel,
    onSelectProduct,
  };

  if (loading) {
    return (
      <DigitalMenuGrid
        products={[]}
        loading
        theme={theme}
        emptyMessage={emptyMessage}
        onSelectProduct={onSelectProduct}
      />
    );
  }

  if (sections.length === 0) {
    return (
      <DigitalMenuGrid
        products={[]}
        loading={false}
        theme={theme}
        emptyMessage={emptyMessage}
        onRetry={onRetry}
        onSelectProduct={onSelectProduct}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => (
        <section
          key={section.categoryId}
          id={menuSectionAnchorId(section.categoryId)}
          data-menu-section={section.categoryId}
          aria-labelledby={`${menuSectionAnchorId(section.categoryId)}-title`}
          className="scroll-mt-[var(--menu-section-offset,7.5rem)]"
        >
          <h2
            id={`${menuSectionAnchorId(section.categoryId)}-title`}
            className={`mb-3 tracking-tight ${headingSizeClass(theme)}`}
            style={{
              color: theme.textColor,
              fontFamily: theme.headingFontFamily,
            }}
          >
            {section.categoryName}
          </h2>
          <DigitalMenuGrid
            {...gridProps}
            products={section.products}
            emptyMessage={emptyMessage}
          />
        </section>
      ))}
    </div>
  );
}
