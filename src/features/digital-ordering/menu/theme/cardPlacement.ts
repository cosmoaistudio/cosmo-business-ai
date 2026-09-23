import type { MenuCtaPosition, MenuPricePosition } from "../types/digitalMenu.types";

export type ResolvedPricePlacement = "top" | "bottom" | "inline";
export type ResolvedCtaPlacement = "bottom" | "inline" | "full";

/** Canonical visual placement — accepts Stage-2 aliases. */
export function resolvePricePlacement(
  value: MenuPricePosition | undefined
): ResolvedPricePlacement {
  if (value === "top") return "top";
  if (value === "inline" || value === "trailing") return "inline";
  return "bottom";
}

export function resolveCtaPlacement(
  value: MenuCtaPosition | undefined
): ResolvedCtaPlacement {
  if (value === "full") return "full";
  if (value === "inline") return "inline";
  return "bottom";
}
