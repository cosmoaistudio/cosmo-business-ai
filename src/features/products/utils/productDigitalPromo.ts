/**
 * Digital Menu promotional price helpers.
 * products.price remains the official sale price (PDV / RPCs).
 */

export function parsePromotionalPrice(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "string" && value.trim() === "") return null;

  const parsed = Number(
    typeof value === "string" ? value.replace(",", ".") : value
  );

  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function isValidPromotionalPrice(
  officialPrice: number,
  promotionalPrice: number | null | undefined
): promotionalPrice is number {
  if (promotionalPrice == null) return false;

  return (
    Number.isFinite(promotionalPrice) &&
    promotionalPrice > 0 &&
    Number.isFinite(officialPrice) &&
    promotionalPrice < officialPrice
  );
}

export function validatePromotionalPriceInput(
  officialPrice: number,
  promotionalInput: unknown
): { value: number | null; error: string | null } {
  const value = parsePromotionalPrice(promotionalInput);

  if (value == null) {
    return { value: null, error: null };
  }

  if (value <= 0) {
    return {
      value,
      error: "O preço promocional deve ser maior que zero.",
    };
  }

  if (!Number.isFinite(officialPrice) || officialPrice <= 0) {
    return {
      value,
      error: "Informe o preço normal antes de definir a promoção.",
    };
  }

  if (value >= officialPrice) {
    return {
      value,
      error: "O preço promocional do cardápio deve ser menor que o preço normal.",
    };
  }

  return { value, error: null };
}

export function normalizeFeatured(value: unknown): boolean {
  return value === true;
}

/** Espelha public.resolve_digital_menu_base_price. Não usar no PDV. */
export function resolveDigitalMenuBasePrice(
  price: number,
  promotionalPrice?: number | null
): number {
  const official = Number(price) || 0;
  return isValidPromotionalPrice(official, promotionalPrice)
    ? promotionalPrice
    : official;
}

/**
 * Converte o unitPrice do Product Engine (base = products.price) para a
 * cobrança digital: base promocional + os mesmos adicionais pagos.
 */
export function digitalCartUnitPrice(
  product: { price: number; promotionalPrice?: number | null },
  engineUnitPrice: number
): number {
  const official = Number(product.price) || 0;
  const paidAddons = Math.max(0, Number(engineUnitPrice) - official);
  return resolveDigitalMenuBasePrice(official, product.promotionalPrice) + paidAddons;
}
