import type {
  EngineBuildState,
  EngineProductGroup,
  EngineProductNode,
  EngineProductOption,
  EngineSelectionItem,
} from "@/features/product-engine/types/productEngine.types";

export const SIZE_GROUP_ID = "grp-size";
export const SAUCE_GROUP_ID = "grp-sauce";
export const PREMIUM_GROUP_ID = "grp-premium";

export const OPTION_SIZE_M = "opt-size-m";
export const OPTION_SIZE_G = "opt-size-g";
export const OPTION_SAUCE_BB = "opt-sauce-bb";
export const OPTION_SAUCE_CH = "opt-sauce-ch";
export const OPTION_PREMIUM_BACON = "opt-premium-bacon";

function group(
  overrides: Partial<EngineProductGroup> & Pick<EngineProductGroup, "id" | "name">
): EngineProductGroup {
  return {
    description: null,
    sortOrder: 0,
    type: "optional",
    selectionType: "checkbox",
    required: false,
    active: true,
    minSelection: 0,
    maxSelection: 3,
    maxFree: 0,
    allowsRepeat: false,
    allowsQuantity: false,
    hidden: false,
    optionIds: [],
    ...overrides,
  };
}

function option(
  overrides: Partial<EngineProductOption> &
    Pick<EngineProductOption, "id" | "groupId" | "name">
): EngineProductOption {
  return {
    description: null,
    imageUrl: null,
    price: 0,
    stock: 10,
    stockControl: false,
    sku: null,
    sortOrder: 0,
    active: true,
    premium: false,
    weight: 0,
    ...overrides,
  };
}

export function createCompositeProductNode(
  overrides: Partial<EngineProductNode> = {}
): EngineProductNode {
  const sizeGroup = group({
    id: SIZE_GROUP_ID,
    name: "Tamanho",
    type: "required",
    selectionType: "radio",
    required: true,
    minSelection: 1,
    maxSelection: 1,
    optionIds: [OPTION_SIZE_M, OPTION_SIZE_G],
  });

  const sauceGroup = group({
    id: SAUCE_GROUP_ID,
    name: "Molho",
    type: "sauce",
    selectionType: "checkbox",
    minSelection: 0,
    maxSelection: 2,
    optionIds: [OPTION_SAUCE_BB, OPTION_SAUCE_CH],
  });

  const premiumGroup = group({
    id: PREMIUM_GROUP_ID,
    name: "Premium",
    type: "premium",
    selectionType: "checkbox",
    minSelection: 0,
    maxSelection: 2,
    optionIds: [OPTION_PREMIUM_BACON],
  });

  return {
    productId: "prod-composite",
    productName: "Combo Especial",
    basePrice: 25,
    status: "active",
    groups: [sizeGroup, sauceGroup, premiumGroup],
    optionsByGroupId: {
      [SIZE_GROUP_ID]: [
        option({
          id: OPTION_SIZE_M,
          groupId: SIZE_GROUP_ID,
          name: "Médio",
          price: 0,
        }),
        option({
          id: OPTION_SIZE_G,
          groupId: SIZE_GROUP_ID,
          name: "Grande",
          price: 5,
        }),
      ],
      [SAUCE_GROUP_ID]: [
        option({
          id: OPTION_SAUCE_BB,
          groupId: SAUCE_GROUP_ID,
          name: "Barbecue",
          price: 2,
        }),
        option({
          id: OPTION_SAUCE_CH,
          groupId: SAUCE_GROUP_ID,
          name: "Cheddar",
          price: 3,
        }),
      ],
      [PREMIUM_GROUP_ID]: [
        option({
          id: OPTION_PREMIUM_BACON,
          groupId: PREMIUM_GROUP_ID,
          name: "Bacon Extra",
          price: 4,
          premium: true,
        }),
      ],
    },
    ...overrides,
  };
}

export function createSimpleProductNode(): EngineProductNode {
  return {
    productId: "prod-simple",
    productName: "Refrigerante",
    basePrice: 8,
    status: "active",
    groups: [],
    optionsByGroupId: {},
  };
}

export function createOutOfStockNode(): EngineProductNode {
  const node = createCompositeProductNode();
  const sizeOptions = node.optionsByGroupId[SIZE_GROUP_ID] ?? [];
  node.optionsByGroupId[SIZE_GROUP_ID] = sizeOptions.map((entry) =>
    entry.id === OPTION_SIZE_M
      ? { ...entry, stock: 0, stockControl: true, active: true }
      : entry
  );
  return node;
}

export function createPausedOptionNode(): EngineProductNode {
  const node = createCompositeProductNode();
  const sauceOptions = node.optionsByGroupId[SAUCE_GROUP_ID] ?? [];
  node.optionsByGroupId[SAUCE_GROUP_ID] = sauceOptions.map((entry) =>
    entry.id === OPTION_SAUCE_BB ? { ...entry, active: false } : entry
  );
  return node;
}

export function createInitialBuildState(productId: string): EngineBuildState {
  return {
    productId,
    step: "groups",
    selections: {},
    observation: "",
  };
}

export function selection(
  overrides: Partial<EngineSelectionItem> &
    Pick<EngineSelectionItem, "groupId" | "optionId" | "optionName">
): EngineSelectionItem {
  return {
    groupName: "Grupo",
    quantity: 1,
    unitPrice: 0,
    premium: false,
    ...overrides,
  };
}

export function validCompositeSelections(): Record<string, EngineSelectionItem[]> {
  return {
    [SIZE_GROUP_ID]: [
      selection({
        groupId: SIZE_GROUP_ID,
        groupName: "Tamanho",
        optionId: OPTION_SIZE_M,
        optionName: "Médio",
        unitPrice: 0,
      }),
    ],
    [SAUCE_GROUP_ID]: [
      selection({
        groupId: SAUCE_GROUP_ID,
        groupName: "Molho",
        optionId: OPTION_SAUCE_BB,
        optionName: "Barbecue",
        unitPrice: 2,
      }),
    ],
  };
}
