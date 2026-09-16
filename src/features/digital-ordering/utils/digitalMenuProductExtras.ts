import type { Product } from "@/features/products/types/product";
import {
  isValidPromotionalPrice,
  normalizeFeatured,
} from "@/features/products/utils/productDigitalPromo";
import type { DigitalMenuProductExtras } from "@/features/product-engine/integrations/digitalMenu.adapter";

/**
 * Catalog extras for the Digital Menu snapshot.
 * promotionalPrice is visual only; featured is Digital Menu exclusive.
 */
export function digitalMenuExtrasFromProduct(
  product: Product
): DigitalMenuProductExtras {
  return {
    menuKind: product.menu_kind,
    imageUrl: product.image_url ?? null,
    categoryName: product.category?.trim() || null,
    description: product.description?.trim() || null,
    promotionalPrice: isValidPromotionalPrice(
      product.price,
      product.promotionalPrice
    )
      ? product.promotionalPrice
      : null,
    featured: normalizeFeatured(product.featured),
  };
}
