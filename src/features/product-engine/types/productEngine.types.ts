import type { SelectionType } from "@/features/product-composition/types/optionGroup";

export const ENGINE_GROUP_TYPES = [
  "required",
  "optional",
  "single_choice",
  "multiple_choice",
  "premium",
  "gift",
  "complement",
  "ingredient",
  "sauce",
  "drink",
] as const;

export type EngineGroupType = (typeof ENGINE_GROUP_TYPES)[number];

export const ENGINE_GROUP_TYPE_LABELS: Record<EngineGroupType, string> = {
  required: "Obrigatório",
  optional: "Opcional",
  single_choice: "Escolha única",
  multiple_choice: "Escolha múltipla",
  premium: "Premium",
  gift: "Brinde",
  complement: "Complemento",
  ingredient: "Ingrediente",
  sauce: "Molho",
  drink: "Bebida",
};

export interface EngineProductGroup {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  type: EngineGroupType;
  selectionType: SelectionType;
  required: boolean;
  active: boolean;
  minSelection: number;
  maxSelection: number;
  maxFree: number;
  allowsRepeat: boolean;
  allowsQuantity: boolean;
  hidden: boolean;
  optionIds: string[];
}

export interface EngineProductOption {
  id: string;
  groupId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stock: number;
  stockControl: boolean;
  sku: string | null;
  sortOrder: number;
  active: boolean;
  premium: boolean;
  weight: number;
}

export interface EngineProductNode {
  productId: string;
  productName: string;
  basePrice: number;
  status: "active" | "inactive";
  groups: EngineProductGroup[];
  optionsByGroupId: Record<string, EngineProductOption[]>;
}

export interface EngineSelectionItem {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  quantity: number;
  unitPrice: number;
  premium: boolean;
}

export interface EngineBuildState {
  productId: string;
  step: "size" | "groups" | "options" | "review";
  selections: Record<string, EngineSelectionItem[]>;
  observation: string;
}

export interface EngineValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EnginePricingResult {
  basePrice: number;
  addonsTotal: number;
  premiumTotal: number;
  quantity: number;
  subtotal: number;
  discountsTotal: number;
  total: number;
  breakdown: Array<{
    label: string;
    amount: number;
    kind: "base" | "addon" | "premium" | "discount";
  }>;
}

export interface EngineDependencyGraph {
  products: Map<string, EngineProductNode>;
  groupToProducts: Map<string, Set<string>>;
  optionToProducts: Map<string, Set<string>>;
  optionToGroups: Map<string, string>;
}

export interface EngineAvailabilityAction {
  optionId: string;
  productId: string;
  action: "pause" | "activate";
  reason: string;
}

export interface EnginePrintSummary {
  productName: string;
  lines: string[];
  total: number;
  observation?: string;
}

export type EngineChannel =
  | "pdv"
  | "delivery"
  | "digital_menu"
  | "mobile"
  | "desktop"
  | "api";

export interface EngineCartPayload {
  productId: string;
  quantity: number;
  unitPrice: number;
  selectedOptions: Array<{
    optionId: string;
    optionName: string;
    quantity: number;
    price: number;
  }>;
  observation: string;
  channel: EngineChannel;
}
