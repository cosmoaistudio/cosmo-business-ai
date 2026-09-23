import { formatCurrency } from "@/lib/format";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";

/**
 * Presentation-only. A product is variable when existing catalog data
 * already shows customization — never inferred from niche.
 */
export function productHasPriceVariation(
  product: Pick<DigitalMenuProduct, "menuKind" | "groups" | "comboSlots">
): boolean {
  if (product.menuKind === "combo") return true;
  if ((product.comboSlots?.length ?? 0) > 0) return true;
  return (product.groups?.length ?? 0) > 0;
}

/** Prefixes "A partir de" when the catalog item can cost more than the base. */
export function fromPriceLabel(
  formattedPrice: string,
  hasVariation: boolean
): string {
  if (!hasVariation || formattedPrice.length === 0) return formattedPrice;
  return `A partir de ${formattedPrice}`;
}

export function formatProductPriceLabel(
  product: Pick<DigitalMenuProduct, "menuKind" | "groups" | "comboSlots">,
  amount: number
): string {
  return fromPriceLabel(formatCurrency(amount), productHasPriceVariation(product));
}
