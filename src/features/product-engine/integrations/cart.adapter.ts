import type { AddCartItemInput, CartItemSummaries } from "@/features/pdv/types/cart";
import type { Product } from "@/features/products/types/product";
import {
  buildBuilderCartPayload,
  removeBuilderOption,
  selectBuilderOption,
} from "../core/productBuilderCore";
import { summaryBuilder } from "../core/SummaryBuilder";
import {
  filterComposerNode,
  getComposerValidationErrors,
  isOptionAvailable,
} from "../utils/availabilityFilter";
import type {
  EngineBuildState,
  EngineProductNode,
  EngineSelectionItem,
} from "../types/productEngine.types";

export type ProductComposerLoader = (
  productId: string
) => Promise<EngineProductNode>;

export interface ComposerConfirmResult {
  valid: boolean;
  errors: string[];
  cartInput?: AddCartItemInput;
}

function buildGroupLookup(node: EngineProductNode) {
  const lookup: Record<string, { groupId: string; groupName: string }> = {};

  for (const group of node.groups) {
    for (const option of node.optionsByGroupId[group.id] ?? []) {
      lookup[option.id] = { groupId: group.id, groupName: group.name };
    }
  }

  return lookup;
}

export function selectionsToEngineState(
  productId: string,
  selections: Record<string, EngineSelectionItem[]>,
  observation: string
): EngineBuildState {
  return {
    productId,
    step: "review",
    selections,
    observation,
  };
}

export function toggleEngineSelection(
  node: EngineProductNode,
  state: EngineBuildState,
  groupId: string,
  optionId: string
): EngineBuildState {
  const group = node.groups.find((entry) => entry.id === groupId);
  const option = node.optionsByGroupId[groupId]?.find(
    (entry) => entry.id === optionId
  );

  if (!group || !option || !isOptionAvailable(option)) {
    return state;
  }

  const item: EngineSelectionItem = {
    groupId,
    groupName: group.name,
    optionId: option.id,
    optionName: option.name,
    quantity: 1,
    unitPrice: option.price,
    premium: group.type === "premium" || option.premium,
  };

  const current = state.selections[groupId] ?? [];
  const isSelected = current.some((entry) => entry.optionId === optionId);

  if (group.selectionType === "radio") {
    return selectBuilderOption(node, state, groupId, item);
  }

  if (isSelected && !group.allowsRepeat) {
    return removeBuilderOption(state, groupId, optionId);
  }

  return selectBuilderOption(node, state, groupId, item);
}

/** Adjust option quantity for PDV +/- UX (respects max / allowQuantity). */
export function adjustEngineOptionQuantity(
  node: EngineProductNode,
  state: EngineBuildState,
  groupId: string,
  optionId: string,
  nextQuantity: number
): EngineBuildState {
  const group = node.groups.find((entry) => entry.id === groupId);
  const option = node.optionsByGroupId[groupId]?.find(
    (entry) => entry.id === optionId
  );

  if (!group || !option || !isOptionAvailable(option)) {
    return state;
  }

  if (nextQuantity <= 0) {
    return removeBuilderOption(state, groupId, optionId);
  }

  const singleChoice =
    group.selectionType === "radio" || group.maxSelection <= 1;

  const current = state.selections[groupId] ?? [];
  const others = current.filter((entry) => entry.optionId !== optionId);
  const othersTotal = others.reduce(
    (sum, entry) => sum + (entry.quantity || 1),
    0
  );
  const remaining = Math.max(0, group.maxSelection - othersTotal);

  if (remaining <= 0) {
    return state;
  }

  const requested = group.allowsQuantity ? Math.max(1, nextQuantity) : 1;
  const qty = Math.min(requested, remaining);

  const item: EngineSelectionItem = {
    groupId,
    groupName: group.name,
    optionId: option.id,
    optionName: option.name,
    quantity: qty,
    unitPrice: option.price,
    premium: group.type === "premium" || option.premium,
  };

  if (singleChoice) {
    return selectBuilderOption(node, state, groupId, item);
  }

  return {
    ...state,
    selections: {
      ...state.selections,
      [groupId]: [...others, item],
    },
  };
}

export async function loadComposerNode(
  productId: string,
  loader: ProductComposerLoader
) {
  const raw = await loader(productId);
  return filterComposerNode(raw);
}

export function confirmComposerSelection(input: {
  product: Product;
  node: EngineProductNode;
  state: EngineBuildState;
  quantity: number;
  channel?: "pdv" | "mobile" | "delivery";
}): ComposerConfirmResult {
  const availabilityErrors = getComposerValidationErrors(input.node);
  if (availabilityErrors.length > 0) {
    return { valid: false, errors: availabilityErrors };
  }

  const result = buildBuilderCartPayload(
    input.node,
    input.state,
    input.channel ?? "pdv",
    input.quantity
  );

  if (!result.valid || !result.cartPayload) {
    return {
      valid: false,
      errors: [
        ...result.validation.errors,
        ...result.ruleErrors,
      ],
    };
  }

  const summaries: CartItemSummaries = summaryBuilder.build(
    input.node,
    input.state,
    input.quantity
  );

  const lookup = buildGroupLookup(input.node);

  const selectedOptions = result.cartPayload.selectedOptions.map((option) => ({
    optionId: option.optionId,
    optionName: option.optionName,
    groupId: lookup[option.optionId]?.groupId ?? "",
    groupName: lookup[option.optionId]?.groupName ?? "",
    price: option.price,
    quantity: option.quantity,
  }));

  return {
    valid: true,
    errors: [],
    cartInput: {
      product: input.product,
      quantity: input.quantity,
      unitPrice: result.cartPayload.unitPrice,
      selectedOptions,
      observation: result.cartPayload.observation,
      summaries,
      engineChannel: result.cartPayload.channel,
    },
  };
}
