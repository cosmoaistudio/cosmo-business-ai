import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import DigitalProductCard from "../../components/DigitalProductCard";
import type { MenuTheme, NicheCopy } from "../types/digitalMenu.types";

interface MenuHighlightsProps {
  products: DigitalMenuProduct[];
  theme: MenuTheme;
  copy: NicheCopy;
  onSelectProduct: (productId: string) => void;
}

export default function MenuHighlights({
  products,
  theme,
  copy,
  onSelectProduct,
}: MenuHighlightsProps) {
  if (products.length === 0) return null;

  return (
    <section aria-label={copy.highlightsTitle}>
      <h2
        className="mb-3 text-sm font-semibold uppercase tracking-wide"
        style={{ color: theme.mutedTextColor }}
      >
        {copy.highlightsTitle}
      </h2>

      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-3 pb-1">
          {products.map((product) => (
            <DigitalProductCard
              key={product.id}
              product={product}
              theme={theme}
              variant="highlight"
              addLabel={copy.addToCartLabel}
              customizableLabel={copy.customizableLabel}
              onSelect={() => onSelectProduct(product.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
