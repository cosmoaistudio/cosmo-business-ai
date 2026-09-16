import type { EngineProductNode } from "../types/productEngine.types";
import type { ProductMenuKind } from "@/features/products/types/product";

export interface DigitalMenuComboSlot {
  id: string;
  componentProductId: string;
  displayName: string;
  quantity: number;
  allowConfiguration: boolean;
  active: boolean;
  /** Max free units hint (max of child group maxFree) for UX. */
  maxFreeHint: number;
}

export interface DigitalMenuProduct {
  id: string;
  name: string;
  basePrice: number;
  available: boolean;
  menuKind?: ProductMenuKind;
  imageUrl?: string | null;
  /** Category name from products.category. Absent in snapshots published before the Digital Menu. */
  categoryName?: string | null;
  description?: string | null;
  /** Only set when the products row exposes a promotional price column. */
  promotionalPrice?: number | null;
  featured?: boolean;
  comboSlots?: DigitalMenuComboSlot[];
  groups: Array<{
    id: string;
    name: string;
    type: string;
    required: boolean;
    min: number;
    max: number;
    maxFree: number;
    options: Array<{
      id: string;
      name: string;
      price: number;
      imageUrl: string | null;
      available: boolean;
    }>;
  }>;
}

export type DigitalMenuProductExtras = {
  menuKind?: ProductMenuKind;
  imageUrl?: string | null;
  categoryName?: string | null;
  description?: string | null;
  promotionalPrice?: number | null;
  featured?: boolean;
  comboSlots?: DigitalMenuComboSlot[];
};

/** Não passar direto em Array.map — o index numérico quebraria extras. */
export function toDigitalMenuProduct(
  node: EngineProductNode,
  extras: DigitalMenuProductExtras = {}
): DigitalMenuProduct {
  const groups = node.groups
    .filter((group) => !group.hidden && group.active)
    .map((group) => ({
      id: group.id,
      name: group.name,
      type: group.type,
      required: group.required,
      min: group.minSelection,
      max: group.maxSelection,
      maxFree: group.maxFree,
      options: (node.optionsByGroupId[group.id] ?? [])
        .filter((option) => option.active)
        .map((option) => ({
          id: option.id,
          name: option.name,
          price: option.price,
          imageUrl: option.imageUrl,
          available: !option.stockControl || option.stock > 0,
        })),
    }));

  const menuKind: ProductMenuKind =
    extras.menuKind ?? (groups.length > 0 ? "assembled" : "simple");

  return {
    id: node.productId,
    name: node.productName,
    basePrice: node.basePrice,
    available: node.status === "active",
    menuKind,
    imageUrl: extras.imageUrl ?? null,
    categoryName: extras.categoryName ?? null,
    description: extras.description ?? null,
    promotionalPrice: extras.promotionalPrice ?? null,
    featured: extras.featured ?? false,
    comboSlots: extras.comboSlots,
    groups: menuKind === "combo" ? [] : groups,
  };
}
