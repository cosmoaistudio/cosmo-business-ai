import type { CompositionOption } from "@/features/product-composition";
import type { ProductOptionGroupWithOptions } from "@/features/product-composition/types/productComposition";

export interface CompositionSelection {
  groupId: string;
  groupName: string;
  option: CompositionOption;
}

export interface CompositionValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCompositionSelections(
  groups: ProductOptionGroupWithOptions[],
  selections: Record<string, string[]>
): CompositionValidationResult {
  const errors: string[] = [];

  for (const link of groups) {
    const group = link.option_groups;
    if (!group) continue;

    const selectedIds = selections[group.id] ?? [];
    const selectedCount = selectedIds.length;

    if (group.required && selectedCount < group.min_selection) {
      errors.push(
        `"${group.name}" é obrigatório (mínimo ${group.min_selection}).`
      );
      continue;
    }

    if (!group.required && selectedCount > 0 && selectedCount < group.min_selection) {
      errors.push(
        `"${group.name}" requer ao menos ${group.min_selection} seleção(ões).`
      );
    }

    if (selectedCount > group.max_selection) {
      errors.push(
        `"${group.name}" permite no máximo ${group.max_selection} seleção(ões).`
      );
    }

    for (const optionId of selectedIds) {
      const option = link.options.find((item) => item.id === optionId);
      if (!option) {
        errors.push(`Opção inválida em "${group.name}".`);
        continue;
      }

      if (option.stock_control && option.stock <= 0) {
        errors.push(`"${option.name}" está sem estoque.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function buildCompositionSelections(
  groups: ProductOptionGroupWithOptions[],
  selections: Record<string, string[]>
): CompositionSelection[] {
  const result: CompositionSelection[] = [];

  for (const link of groups) {
    const group = link.option_groups;
    if (!group) continue;

    for (const optionId of selections[group.id] ?? []) {
      const option = link.options.find((item) => item.id === optionId);
      if (!option) continue;

      result.push({
        groupId: group.id,
        groupName: group.name,
        option,
      });
    }
  }

  return result;
}

export function toggleOptionSelection(
  group: ProductOptionGroupWithOptions,
  current: string[],
  optionId: string
): string[] {
  const meta = group.option_groups;
  if (!meta) return current;

  if (meta.selection_type === "radio") {
    return current.includes(optionId) ? [] : [optionId];
  }

  if (current.includes(optionId)) {
    return current.filter((id) => id !== optionId);
  }

  if (current.length >= meta.max_selection) {
    return current;
  }

  return [...current, optionId];
}

export function isOptionDisabled(
  group: ProductOptionGroupWithOptions,
  selectedIds: string[],
  option: CompositionOption
): boolean {
  const meta = group.option_groups;
  if (!meta) return true;

  if (!option.active) return true;
  if (option.stock_control && option.stock <= 0) return true;

  if (meta.selection_type === "checkbox" && !selectedIds.includes(option.id)) {
    return selectedIds.length >= meta.max_selection;
  }

  return false;
}
