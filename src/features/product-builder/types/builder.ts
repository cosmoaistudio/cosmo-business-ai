import type { CompositionOption } from "@/features/product-composition/types/option";
import type { OptionGroup, OptionGroupType } from "@/features/product-composition/types/optionGroup";
import type { CreateProductDTO } from "@/features/products/repository/products.repository";

export const BUILDER_SIZE_GROUP_NAMES = ["Tamanhos", "Tamanho", "Sizes", "Size"];

export function isSizeGroupName(name: string) {
  return BUILDER_SIZE_GROUP_NAMES.some(
    (candidate) => candidate.toLowerCase() === name.trim().toLowerCase()
  );
}

export type BuilderScreen = "editor" | "builder" | "preview";

export interface BuilderProductForm {
  name: string;
  category: string;
  price: string;
  description: string;
  status: string;
  image_url: string;
  sku: string;
}

export interface BuilderSize {
  id: string;
  optionId?: string;
  name: string;
  price: number;
  sortOrder: number;
  active: boolean;
}

export interface BuilderGroupDisplayConfig {
  showPrice: boolean;
  showImage: boolean;
  showDescription: boolean;
  allowObservation: boolean;
}

export const DEFAULT_DISPLAY_CONFIG: BuilderGroupDisplayConfig = {
  showPrice: true,
  showImage: true,
  showDescription: true,
  allowObservation: true,
};

export interface BuilderGroupState {
  groupId: string;
  linkId?: string;
  sortOrder: number;
  linked: boolean;
  isSizeGroup: boolean;
  group: OptionGroup;
  options: CompositionOption[];
  display: BuilderGroupDisplayConfig;
}

export interface BuilderRulesSummary {
  totalGroups: number;
  requiredGroups: number;
  optionalGroups: number;
  totalOptions: number;
  pausedOptions: number;
  premiumGroups: number;
}

export interface BuilderSavePayload {
  productId: string;
  product: Partial<CreateProductDTO>;
  sizes: BuilderSize[];
  sizeGroupId?: string | null;
  linkedGroups: Array<{
    groupId: string;
    linkId?: string;
    sortOrder: number;
    group: OptionGroup;
    options: CompositionOption[];
  }>;
}

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

export const GROUP_TYPE_OPTIONS: Array<{ value: OptionGroupType; label: string }> = [
  { value: "required", label: "Obrigatório" },
  { value: "optional", label: "Opcional" },
  { value: "single_choice", label: "Escolha única" },
  { value: "multiple_choice", label: "Escolha múltipla" },
  { value: "premium", label: "Premium" },
  { value: "gift", label: "Brinde" },
  { value: "complement", label: "Complemento" },
  { value: "ingredient", label: "Ingrediente" },
  { value: "sauce", label: "Molho" },
  { value: "drink", label: "Bebida" },
];

export function defaultOptionGroup(name = "Novo grupo"): Partial<OptionGroup> {
  return {
    name,
    description: null,
    selection_type: "checkbox",
    min_selection: 0,
    max_selection: 1,
    required: false,
    sort_order: 0,
    group_type: "optional",
    display_style: "list",
    max_free: 0,
    allow_repeat: false,
    allow_quantity: false,
    hidden: false,
    priority: 0,
    icon: null,
    color: null,
    is_premium: false,
    is_recommended: false,
  };
}
