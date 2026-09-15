import type { CompositionOption } from "@/features/product-composition/types/option";
import type { OptionGroup } from "@/features/product-composition/types/optionGroup";
import type { Product } from "@/features/products/types/product";
import type {
  EngineGroupType,
  EngineProductGroup,
  EngineProductNode,
  EngineProductOption,
} from "../types/productEngine.types";

const GROUP_TYPE_KEYWORDS: Array<{ type: EngineGroupType; patterns: RegExp[] }> = [
  { type: "drink", patterns: [/bebida/i, /drink/i, /suco/i, /refri/i] },
  { type: "sauce", patterns: [/molho/i, /sauce/i, /cobertura/i] },
  { type: "ingredient", patterns: [/ingrediente/i, /recheio/i, /acompanh/i] },
  { type: "gift", patterns: [/brinde/i, /gift/i, /grátis/i, /gratis/i] },
  { type: "premium", patterns: [/premium/i, /especial/i, /gourmet/i] },
  { type: "complement", patterns: [/complemento/i, /adicional/i, /extra/i] },
];

const SIZE_GROUP_NAMES = ["tamanhos", "tamanho", "sizes", "size", "porção", "porcoes"];

export function isSizeGroupName(name: string) {
  return SIZE_GROUP_NAMES.includes(name.trim().toLowerCase());
}

export function inferGroupType(group: OptionGroup): EngineGroupType {
  const normalized = group.name.trim();

  for (const entry of GROUP_TYPE_KEYWORDS) {
    if (entry.patterns.some((pattern) => pattern.test(normalized))) {
      return entry.type;
    }
  }

  if (isSizeGroupName(normalized)) return "single_choice";
  if (group.selection_type === "radio") return group.required ? "required" : "single_choice";
  if (group.required) return "required";
  return "multiple_choice";
}

export function mapOptionGroupToEngine(
  group: OptionGroup,
  optionIds: string[] = []
): EngineProductGroup {
  const type = group.group_type ?? inferGroupType(group);

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    sortOrder: group.priority ?? group.sort_order,
    type,
    selectionType: group.selection_type,
    required: group.required,
    active: true,
    minSelection: group.min_selection,
    maxSelection: group.max_selection,
    maxFree: group.max_free ?? (type === "gift" ? group.max_selection : 0),
    allowsRepeat: group.allow_repeat ?? (group.selection_type === "checkbox" && group.max_selection > 1),
    allowsQuantity: group.allow_quantity ?? false,
    hidden: group.hidden ?? false,
    optionIds,
  };
}

export function mapOptionToEngine(option: CompositionOption): EngineProductOption {
  return {
    id: option.id,
    groupId: option.group_id,
    name: option.name,
    description: option.description,
    imageUrl: option.image_url,
    price: Number(option.price),
    stock: Number(option.stock),
    stockControl: option.stock_control,
    sku: option.sku ?? option.id.slice(0, 8).toUpperCase(),
    sortOrder: option.priority ?? option.sort_order,
    active: option.active,
    premium: Boolean(option.is_featured) || Number(option.price) > 0,
    weight: Number(option.weight ?? 0),
  };
}

export function mapProductToEngineNode(input: {
  product: Product;
  groups: EngineProductGroup[];
  optionsByGroupId: Record<string, EngineProductOption[]>;
}): EngineProductNode {
  return {
    productId: input.product.id,
    productName: input.product.name,
    basePrice: Number(input.product.price),
    status: input.product.status,
    groups: input.groups,
    optionsByGroupId: input.optionsByGroupId,
  };
}
