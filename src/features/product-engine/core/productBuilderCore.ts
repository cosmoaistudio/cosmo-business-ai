import type {
  EngineBuildState,
  EngineCartPayload,
  EngineChannel,
  EngineProductNode,
  EngineSelectionItem,
  EngineValidationResult,
} from "../types/productEngine.types";
import { productPricingEngine } from "../engines/ProductPricingEngine";
import { productRulesEngine } from "../engines/ProductRulesEngine";
import { productValidator } from "../engines/ProductValidator";

export interface ProductBuilderResult {
  valid: boolean;
  validation: EngineValidationResult;
  ruleErrors: string[];
  pricing: ReturnType<typeof productPricingEngine.calculateFromBuildState>;
  cartPayload?: EngineCartPayload;
}

export function selectBuilderOption(
  node: EngineProductNode,
  state: EngineBuildState,
  groupId: string,
  option: EngineSelectionItem
): EngineBuildState {
  const group = node.groups.find((entry) => entry.id === groupId);
  if (!group) return state;

  const current = state.selections[groupId] ?? [];

  if (group.selectionType === "radio") {
    return {
      ...state,
      selections: {
        ...state.selections,
        [groupId]: [option],
      },
    };
  }

  const withoutDuplicate = group.allowsRepeat
    ? current
    : current.filter((item) => item.optionId !== option.optionId);

  return {
    ...state,
    selections: {
      ...state.selections,
      [groupId]: [...withoutDuplicate, option],
    },
  };
}

export function removeBuilderOption(
  state: EngineBuildState,
  groupId: string,
  optionId: string
): EngineBuildState {
  const current = state.selections[groupId] ?? [];
  return {
    ...state,
    selections: {
      ...state.selections,
      [groupId]: current.filter((item) => item.optionId !== optionId),
    },
  };
}

export function buildBuilderCartPayload(
  node: EngineProductNode,
  state: EngineBuildState,
  channel: EngineChannel,
  quantity = 1
): ProductBuilderResult {
  const validation = productValidator.validateBuildState(node, state);
  const rules = productRulesEngine.evaluate(node, state.selections);
  const pricing = productPricingEngine.calculateFromBuildState(node, state);
  const valid = validation.valid && rules.valid;

  if (!valid) {
    return {
      valid: false,
      validation,
      ruleErrors: rules.errors,
      pricing,
    };
  }

  const selectedOptions = Object.values(state.selections)
    .flat()
    .map((item) => ({
      optionId: item.optionId,
      optionName: item.optionName,
      quantity: item.quantity,
      price: item.unitPrice,
    }));

  return {
    valid: true,
    validation,
    ruleErrors: [],
    pricing,
    cartPayload: {
      productId: node.productId,
      quantity,
      unitPrice: pricing.total,
      selectedOptions,
      observation: state.observation,
      channel,
    },
  };
}
