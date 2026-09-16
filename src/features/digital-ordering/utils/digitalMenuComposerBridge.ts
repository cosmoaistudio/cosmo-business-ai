/**
 * Bridges the public catalog snapshot (DigitalMenuProduct) into the shared
 * Product Composer without calling authenticated product repositories.
 * Used by /menu/:slug for anon customers.
 */
import type { Product } from "@/features/products/types/product";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import {
  ENGINE_GROUP_TYPES,
  type EngineGroupType,
  type EngineProductNode,
  type EngineProductGroup,
  type EngineProductOption,
} from "@/features/product-engine/types/productEngine.types";

function toEngineGroupType(value: string): EngineGroupType {
  if ((ENGINE_GROUP_TYPES as readonly string[]).includes(value)) {
    return value as EngineGroupType;
  }
  return value === "required" ? "required" : "optional";
}

export function productFromDigitalMenuProduct(
  menu: DigitalMenuProduct
): Product {
  const menuKind =
    menu.menuKind ?? (menu.groups.length > 0 ? "assembled" : "simple");

  return {
    id: menu.id,
    name: menu.name,
    category: menu.categoryName?.trim() || "",
    description: menu.description?.trim() || "",
    // Official base for ProductPricingEngine; promotional base is applied
    // in the Digital Menu sheet / cart helpers (server still recalculates).
    price: Number(menu.basePrice) || 0,
    stock: 9999,
    min_stock: 0,
    image_url: menu.imageUrl ?? null,
    image: menu.imageUrl ?? undefined,
    status: menu.available === false ? "inactive" : "active",
    menu_kind: menuKind,
    promotionalPrice: menu.promotionalPrice ?? null,
    featured: menu.featured === true,
    created_at: new Date().toISOString(),
  };
}

export function engineNodeFromDigitalMenuProduct(
  menu: DigitalMenuProduct
): EngineProductNode {
  const groups: EngineProductGroup[] = [];
  const optionsByGroupId: Record<string, EngineProductOption[]> = {};

  menu.groups.forEach((group, index) => {
    const type = toEngineGroupType(group.type);
    const options: EngineProductOption[] = group.options.map(
      (option, optionIndex) => ({
        id: option.id,
        groupId: group.id,
        name: option.name,
        description: null,
        imageUrl: option.imageUrl,
        price: Number(option.price) || 0,
        stock: option.available === false ? 0 : 9999,
        stockControl: option.available === false,
        sku: null,
        sortOrder: optionIndex,
        active: option.available !== false,
        premium: type === "premium",
        weight: 0,
      })
    );

    groups.push({
      id: group.id,
      name: group.name,
      description: null,
      sortOrder: index,
      type,
      selectionType: group.max <= 1 ? "radio" : "checkbox",
      required: group.required,
      active: true,
      minSelection: group.min,
      maxSelection: group.max,
      maxFree: group.maxFree,
      allowsRepeat: group.max > 1,
      allowsQuantity: group.max > 1,
      hidden: false,
      optionIds: options.map((option) => option.id),
    });

    optionsByGroupId[group.id] = options;
  });

  return {
    productId: menu.id,
    productName: menu.name,
    basePrice: Number(menu.basePrice) || 0,
    status: menu.available === false ? "inactive" : "active",
    groups,
    optionsByGroupId,
  };
}

export function composerInputFromDigitalMenuProduct(menu: DigitalMenuProduct) {
  return {
    product: productFromDigitalMenuProduct(menu),
    node: engineNodeFromDigitalMenuProduct(menu),
  };
}
