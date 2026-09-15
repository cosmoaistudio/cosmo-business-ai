import type {
  EngineProductGroup,
  EngineProductNode,
  EngineProductOption,
} from "../types/productEngine.types";

export function isOptionAvailable(option: EngineProductOption) {
  if (!option.active) return false;
  if (option.stockControl && option.stock <= 0) return false;
  return true;
}

export function filterAvailableOptions(options: EngineProductOption[]) {
  return options.filter(isOptionAvailable);
}

export function isGroupAvailable(
  group: EngineProductGroup,
  options: EngineProductOption[]
) {
  if (group.hidden) return true;
  if (!group.required) return true;
  return filterAvailableOptions(options).length > 0;
}

export function filterComposerNode(node: EngineProductNode): {
  node: EngineProductNode;
  blocked: boolean;
  blockedReason?: string;
} {
  const visibleGroups = node.groups.filter((group) => !group.hidden);
  const groups: EngineProductGroup[] = [];
  const optionsByGroupId: EngineProductNode["optionsByGroupId"] = {};

  for (const group of visibleGroups) {
    // Keep unavailable options visible so the operator sees "Indisponível"
    // instead of a silent disappearance after pause.
    const options = [...(node.optionsByGroupId[group.id] ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
    );
    optionsByGroupId[group.id] = options;
    groups.push(group);
  }

  const blockedGroup = groups.find(
    (group) =>
      group.required &&
      filterAvailableOptions(optionsByGroupId[group.id] ?? []).length === 0
  );

  return {
    node: {
      ...node,
      groups,
      optionsByGroupId,
    },
    blocked: Boolean(blockedGroup),
    blockedReason: blockedGroup
      ? `Grupo obrigatório "${blockedGroup.name}" indisponível.`
      : undefined,
  };
}

export function getComposerValidationErrors(node: EngineProductNode) {
  const errors: string[] = [];

  if (node.status !== "active") {
    errors.push("Produto pausado e indisponível para venda.");
  }

  for (const group of node.groups) {
    if (group.hidden) continue;
    const options = node.optionsByGroupId[group.id] ?? [];
    if (group.required && filterAvailableOptions(options).length === 0) {
      errors.push(`Grupo "${group.name}" sem opções disponíveis.`);
    }
  }

  return errors;
}
