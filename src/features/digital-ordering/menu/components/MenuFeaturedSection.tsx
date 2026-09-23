import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import DigitalMenuGrid from "../../components/DigitalMenuGrid";
import type { MenuTheme } from "../types/digitalMenu.types";
import type { MenuCardEmphasis } from "../types/menuTemplate.types";
import { headingSizeClass } from "../theme/menuTheme";
import {
  FEATURED_SECTION_ANCHOR_ID,
  FEATURED_SECTION_ID,
  menuSectionAnchorId,
} from "../core/menuSectionNav";

interface MenuFeaturedSectionProps {
  products: DigitalMenuProduct[];
  title: string;
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
}

export default function MenuFeaturedSection({
  products,
  title,
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
}: MenuFeaturedSectionProps) {
  if (products.length === 0) return null;

  const headingId = `${menuSectionAnchorId(FEATURED_SECTION_ID)}-title`;

  return (
    <section
      id={FEATURED_SECTION_ANCHOR_ID}
      data-menu-section={FEATURED_SECTION_ID}
      data-menu-featured=""
      aria-labelledby={headingId}
      className="scroll-mt-[var(--menu-section-offset,7.5rem)]"
    >
      <h2
        id={headingId}
        className={`mb-3 tracking-tight ${headingSizeClass(theme)}`}
        style={{
          color: theme.textColor,
          fontFamily: theme.headingFontFamily,
        }}
      >
        {title}
      </h2>
      <DigitalMenuGrid
        products={products}
        loading={false}
        theme={theme}
        emptyMessage={emptyMessage}
        showDescriptions={showDescriptions}
        showImages={showImages}
        showPopularBadge={showPopularBadge}
        showPromotions={showPromotions}
        cardEmphasis={cardEmphasis}
        addLabel={addLabel}
        customizableLabel={customizableLabel}
        onSelectProduct={onSelectProduct}
      />
    </section>
  );
}
