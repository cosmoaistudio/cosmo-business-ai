import type { Product, ProductMenuKind } from "../types/product";

/**
 * Menu kind: prefers products.menu_kind (migration 026).
 * Fallback: derived from composition link counts (pre-migration).
 * True combos require DB menu_kind='combo' + product_combo_components.
 */
export type ProductMenuFilter =
  | "all"
  | "simple"
  | "assembled"
  | "combo"
  | "paused";

export function resolveProductMenuKind(input: {
  status: string;
  compositionGroupCount: number;
  menuKind?: ProductMenuKind | null;
}): ProductMenuKind | "paused" {
  if (input.status !== "active") return "paused";
  if (input.menuKind === "combo") return "combo";
  if (input.menuKind === "assembled") return "assembled";
  if (input.menuKind === "simple") return "simple";
  if (input.compositionGroupCount > 0) return "assembled";
  return "simple";
}

export function resolveKindFromProduct(
  product: Product,
  compositionGroupCount = 0
) {
  return resolveProductMenuKind({
    status: product.status,
    compositionGroupCount,
    menuKind: product.menu_kind,
  });
}

export function productMenuKindLabel(
  kind: ProductMenuKind | "paused" | "combo"
): string {
  switch (kind) {
    case "simple":
      return "Produto simples";
    case "assembled":
      return "Copo montado";
    case "combo":
      return "Combo";
    case "paused":
      return "Pausado";
    default:
      return "Produto";
  }
}

export function productMenuKindEmoji(
  kind: ProductMenuKind | "paused" | "combo"
): string {
  switch (kind) {
    case "assembled":
      return "🥤";
    case "combo":
      return "🎁";
    case "paused":
      return "⏸";
    default:
      return "•";
  }
}
