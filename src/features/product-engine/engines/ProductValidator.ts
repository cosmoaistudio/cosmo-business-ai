import type {
  EngineBuildState,
  EngineProductGroup,
  EngineProductNode,
  EngineProductOption,
  EngineSelectionItem,
  EngineValidationResult,
} from "../types/productEngine.types";

function countSelections(items: EngineSelectionItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function uniqueOptionIds(items: EngineSelectionItem[]) {
  return new Set(items.map((item) => item.optionId));
}

export class ProductValidator {
  validateGroup(
    group: EngineProductGroup,
    options: EngineProductOption[],
    selections: EngineSelectionItem[]
  ): EngineValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const total = countSelections(selections);
    const activeOptions = options.filter((option) => option.active);

    if (!group.active && total > 0) {
      errors.push(`O grupo "${group.name}" está inativo.`);
    }

    if (group.required && total < Math.max(1, group.minSelection)) {
      errors.push(`Selecione ao menos ${group.minSelection} opção(ões) em "${group.name}".`);
    }

    if (total < group.minSelection) {
      errors.push(`"${group.name}" exige no mínimo ${group.minSelection} seleção(ões).`);
    }

    if (total > group.maxSelection) {
      errors.push(`"${group.name}" permite no máximo ${group.maxSelection} seleção(ões).`);
    }

    if (group.selectionType === "radio" && uniqueOptionIds(selections).size > 1) {
      errors.push(`"${group.name}" permite apenas uma opção.`);
    }

    if (!group.allowsRepeat && uniqueOptionIds(selections).size !== selections.length) {
      errors.push(`"${group.name}" não permite opções duplicadas.`);
    }

    for (const item of selections) {
      const option = options.find((entry) => entry.id === item.optionId);
      if (!option) {
        errors.push(`Opção inválida selecionada em "${group.name}".`);
        continue;
      }

      if (!option.active) {
        errors.push(`"${option.name}" está indisponível.`);
      }

      if (option.stockControl && option.stock < item.quantity) {
        errors.push(`Estoque insuficiente para "${option.name}".`);
      }
    }

    if (group.maxFree > 0 && total > group.maxFree) {
      const paidCount = total - group.maxFree;
      if (paidCount > 0) {
        warnings.push(
          `${group.maxFree} item(ns) grátis em "${group.name}"; ${paidCount} será(ão) cobrado(s).`
        );
      }
    }

    if (activeOptions.length === 0 && group.required) {
      errors.push(`"${group.name}" não possui opções ativas.`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  validateNode(
    node: EngineProductNode,
    selections: Record<string, EngineSelectionItem[]>
  ): EngineValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (node.status !== "active") {
      errors.push(`O produto "${node.productName}" está pausado.`);
    }

    const visibleGroups = node.groups.filter((group) => !group.hidden && group.active);

    for (const group of visibleGroups) {
      const groupSelections = selections[group.id] ?? [];
      const options = node.optionsByGroupId[group.id] ?? [];
      const result = this.validateGroup(group, options, groupSelections);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    }

    for (const group of visibleGroups) {
      if (group.required && !(selections[group.id]?.length ?? 0)) {
        errors.push(`O grupo obrigatório "${group.name}" não foi preenchido.`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  validateBuildState(
    node: EngineProductNode,
    state: EngineBuildState
  ): EngineValidationResult {
    return this.validateNode(node, state.selections);
  }
}

export const productValidator = new ProductValidator();
