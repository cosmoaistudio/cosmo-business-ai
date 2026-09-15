import type {
  EngineProductGroup,
  EngineProductNode,
  EngineSelectionItem,
} from "../types/productEngine.types";

export interface EngineRuleContext {
  node: EngineProductNode;
  group: EngineProductGroup;
  selections: EngineSelectionItem[];
  allSelections: Record<string, EngineSelectionItem[]>;
}

export interface EngineRule {
  id: string;
  description: string;
  applies: (context: EngineRuleContext) => boolean;
  validate: (context: EngineRuleContext) => string | null;
}

const PREMIUM_REQUIRES_BASE: EngineRule = {
  id: "premium-requires-base",
  description: "Grupos premium exigem seleção de tamanho/base.",
  applies: ({ group }) => group.type === "premium",
  validate: ({ allSelections, node }) => {
    const sizeGroup = node.groups.find((entry) =>
      /tamanho|size|porção/i.test(entry.name)
    );
    if (!sizeGroup) return null;
    if ((allSelections[sizeGroup.id]?.length ?? 0) === 0) {
      return "Selecione um tamanho antes dos adicionais premium.";
    }
    return null;
  },
};

const GIFT_LIMIT: EngineRule = {
  id: "gift-limit",
  description: "Brindes respeitam limite máximo gratuito.",
  applies: ({ group }) => group.type === "gift",
  validate: ({ group, selections }) => {
    const total = selections.reduce((sum, item) => sum + item.quantity, 0);
    if (group.maxFree > 0 && total > group.maxFree) {
      return `Brindes limitados a ${group.maxFree} item(ns).`;
    }
    return null;
  },
};

const INGREDIENT_CONFLICT: EngineRule = {
  id: "ingredient-conflict",
  description: "Ingredientes mutuamente exclusivos (ex.: sem cebola / extra cebola).",
  applies: ({ group }) => group.type === "ingredient",
  validate: ({ selections }) => {
    const names = selections.map((item) => item.optionName.toLowerCase());
    const hasNoOnion = names.some((name) => name.includes("sem cebola"));
    const hasExtraOnion = names.some((name) => name.includes("extra cebola"));
    if (hasNoOnion && hasExtraOnion) {
      return "Combinação inválida: sem cebola e extra cebola.";
    }
    return null;
  },
};

export class ProductRulesEngine {
  private readonly rules: EngineRule[];

  constructor(rules: EngineRule[] = [
    PREMIUM_REQUIRES_BASE,
    GIFT_LIMIT,
    INGREDIENT_CONFLICT,
  ]) {
    this.rules = rules;
  }

  evaluate(
    node: EngineProductNode,
    selections: Record<string, EngineSelectionItem[]>
  ) {
    const errors: string[] = [];

    for (const group of node.groups) {
      const context: EngineRuleContext = {
        node,
        group,
        selections: selections[group.id] ?? [],
        allSelections: selections,
      };

      for (const rule of this.rules) {
        if (!rule.applies(context)) continue;
        const message = rule.validate(context);
        if (message) errors.push(message);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

export const productRulesEngine = new ProductRulesEngine();
