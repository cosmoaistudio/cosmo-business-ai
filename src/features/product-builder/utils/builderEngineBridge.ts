import type { CompositionOption } from "@/features/product-composition/types/option";
import type { OptionGroup } from "@/features/product-composition/types/optionGroup";
import type { Product } from "@/features/products/types/product";
import {
  mapOptionGroupToEngine,
  mapOptionToEngine,
  mapProductToEngineNode,
} from "@/features/product-engine/adapters/compositionAdapter";
import {
  productDependencyEngine,
  productPricingEngine,
  productRulesEngine,
  productValidator,
} from "@/features/product-engine";
import type {
  EngineBuildState,
  EngineProductNode,
  EngineSelectionItem,
} from "@/features/product-engine/types/productEngine.types";
import type { BuilderGroupState, BuilderProductForm, BuilderSize } from "../types/builder";

export interface BuilderValidationState {
  productErrors: string[];
  groupErrors: Record<string, string[]>;
  previewValidation: ReturnType<typeof productValidator.validateNode>;
  rulesValidation: ReturnType<typeof productRulesEngine.evaluate>;
  dependencyWarnings: string[];
  valid: boolean;
}

export function buildEngineNodeFromBuilder(input: {
  product: Product;
  productForm: BuilderProductForm;
  previewGroups: BuilderGroupState[];
  sizes: BuilderSize[];
}): EngineProductNode {
  const groups = input.previewGroups.map((entry) =>
    mapOptionGroupToEngine(
      entry.group,
      entry.options.map((option) => option.id)
    )
  );

  const optionsByGroupId = Object.fromEntries(
    input.previewGroups.map((entry) => [
      entry.groupId,
      entry.options.map(mapOptionToEngine),
    ])
  );

  const basePrice =
    input.sizes.length > 0
      ? Math.min(...input.sizes.map((size) => size.price))
      : Number(input.productForm.price) || 0;

  return mapProductToEngineNode({
    product: {
      ...input.product,
      name: input.productForm.name,
      description: input.productForm.description,
      price: basePrice,
      status: input.productForm.status as Product["status"],
    },
    groups,
    optionsByGroupId,
  });
}

export function buildPreviewSelections(
  groups: BuilderGroupState[],
  selections: Record<string, string[]>
): Record<string, EngineSelectionItem[]> {
  const result: Record<string, EngineSelectionItem[]> = {};

  for (const group of groups) {
    const meta = group.group;
    const selectedIds = selections[meta.id] ?? [];

    result[meta.id] = selectedIds.map((optionId) => {
      const option = group.options.find((entry) => entry.id === optionId);
      return {
        groupId: meta.id,
        groupName: meta.name,
        optionId,
        optionName: option?.name ?? "Opção",
        quantity: 1,
        unitPrice: Number(option?.price ?? 0),
        premium: Boolean(meta.is_premium || (option?.price ?? 0) > 0),
      };
    });
  }

  return result;
}

export function validateBuilderState(input: {
  productForm: BuilderProductForm;
  previewGroups: BuilderGroupState[];
  previewSelections: Record<string, string[]>;
  engineNode: EngineProductNode;
}): BuilderValidationState {
  const productErrors: string[] = [];

  if (!input.productForm.name.trim()) {
    productErrors.push("Informe o nome do produto.");
  }

  if (Number(input.productForm.price) < 0) {
    productErrors.push("O preço base não pode ser negativo.");
  }

  const groupErrors: Record<string, string[]> = {};

  for (const group of input.previewGroups) {
    const errors: string[] = [];
    const meta = group.group;

    if (meta.max_selection < meta.min_selection) {
      errors.push("A seleção máxima deve ser maior ou igual à mínima.");
    }

    if (meta.required && meta.max_selection < 1) {
      errors.push("Grupos obrigatórios precisam permitir ao menos uma seleção.");
    }

    if (meta.selection_type === "radio" && meta.max_selection !== 1) {
      errors.push("Grupos de escolha única devem ter máximo = 1.");
    }

    if ((meta.max_free ?? 0) > meta.max_selection) {
      errors.push("Máximo grátis não pode exceder a seleção máxima.");
    }

    if (group.options.length === 0) {
      errors.push("Adicione ao menos uma opção neste grupo.");
    }

    if (errors.length > 0) {
      groupErrors[group.groupId] = errors;
    }
  }

  const engineSelections = buildPreviewSelections(
    input.previewGroups,
    input.previewSelections
  );

  const previewValidation = productValidator.validateNode(
    input.engineNode,
    engineSelections
  );

  const rulesValidation = productRulesEngine.evaluate(
    input.engineNode,
    engineSelections
  );

  const graph = productDependencyEngine.buildGraph([input.engineNode]);
  const dependencyWarnings: string[] = [];

  for (const group of input.previewGroups) {
    for (const option of group.options) {
      if (!option.stock_control || option.stock > 0) continue;
      const affected = productDependencyEngine.getAffectedProductIds(
        graph,
        option.id
      );
      if (affected.length > 0) {
        dependencyWarnings.push(
          `"${option.name}" sem estoque afeta ${affected.length} produto(s).`
        );
      }
    }
  }

  const valid =
    productErrors.length === 0 &&
    Object.keys(groupErrors).length === 0 &&
    previewValidation.valid &&
    rulesValidation.valid;

  return {
    productErrors,
    groupErrors,
    previewValidation,
    rulesValidation,
    dependencyWarnings,
    valid,
  };
}

export function calculatePreviewPricing(
  engineNode: EngineProductNode,
  previewGroups: BuilderGroupState[],
  previewSelections: Record<string, string[]>
) {
  const engineSelections = buildPreviewSelections(
    previewGroups,
    previewSelections
  );

  return productPricingEngine.calculate(engineNode, engineSelections, 1);
}

export function createEmptyBuildState(productId: string): EngineBuildState {
  return {
    productId,
    step: "size",
    selections: {},
    observation: "",
  };
}

export function extractEnterpriseGroupPayload(group: OptionGroup) {
  return {
    group_type: group.group_type,
    display_style: group.display_style,
    max_free: group.max_free,
    allow_repeat: group.allow_repeat,
    allow_quantity: group.allow_quantity,
    hidden: group.hidden,
    priority: group.priority,
    icon: group.icon,
    color: group.color,
    is_premium: group.is_premium,
    is_recommended: group.is_recommended,
  };
}

export function extractEnterpriseOptionPayload(option: CompositionOption) {
  return {
    sku: option.sku,
    barcode: option.barcode,
    weight: option.weight,
    cost_price: option.cost_price,
    nutrition: option.nutrition,
    preparation_time: option.preparation_time,
    priority: option.priority,
    is_featured: option.is_featured,
    is_default: option.is_default,
    min_quantity: option.min_quantity,
    max_quantity: option.max_quantity,
  };
}
