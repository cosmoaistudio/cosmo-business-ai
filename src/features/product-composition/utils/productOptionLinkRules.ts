import type { OptionGroup } from "../types/optionGroup";
import type { ProductOptionGroupWithGroup } from "../types/productOptionGroup";

export const PENDING_LINK_PREFIX = "pending:";

export function makePendingLinkId(groupId: string): string {
  return `${PENDING_LINK_PREFIX}${groupId}`;
}

export function isPendingLinkId(linkId: string): boolean {
  return linkId.startsWith(PENDING_LINK_PREFIX);
}

export function pendingGroupIdFromLinkId(linkId: string): string | null {
  if (!isPendingLinkId(linkId)) return null;
  return linkId.slice(PENDING_LINK_PREFIX.length);
}

/** Local-only link row used before the product has an id. */
export function makePendingProductOptionLink(
  group: OptionGroup,
  sortOrder: number,
  optionCount = 0
): ProductOptionGroupWithGroup & { optionCount?: number } {
  return {
    id: makePendingLinkId(group.id),
    product_id: "",
    group_id: group.id,
    sort_order: sortOrder,
    created_at: new Date(0).toISOString(),
    option_groups: group,
    optionCount,
  };
}

export function getLinkedGroupIds(
  links: Array<Pick<ProductOptionGroupWithGroup, "group_id">>
): string[] {
  return links.map((link) => link.group_id);
}

export function filterUnlinkedOptionGroups(
  allGroups: OptionGroup[],
  linkedGroupIds: Iterable<string>
): OptionGroup[] {
  const linked = new Set(linkedGroupIds);
  return allGroups.filter((group) => !linked.has(group.id));
}

export function canLinkOptionGroup(
  groupId: string,
  linkedGroupIds: Iterable<string>
): { ok: true } | { ok: false; reason: "empty" | "duplicate" } {
  if (!groupId) return { ok: false, reason: "empty" };
  for (const id of linkedGroupIds) {
    if (id === groupId) return { ok: false, reason: "duplicate" };
  }
  return { ok: true };
}

/** Human-readable selection rule for cards. */
export function formatOptionGroupSelectionRule(
  group: Pick<OptionGroup, "min_selection" | "max_selection" | "required">
): string {
  const min = Number(group.min_selection) || 0;
  const max = Number(group.max_selection) || 0;

  if (max <= 0 && min <= 0) {
    return group.required ? "Obrigatório" : "Opcional";
  }

  if (min === max) {
    return min === 1
      ? "Cliente escolhe 1"
      : `Cliente escolhe ${min}`;
  }

  if (min === 0) {
    return max === 1
      ? "Cliente escolhe até 1"
      : `Cliente escolhe até ${max}`;
  }

  return `Cliente escolhe de ${min} a ${max}`;
}

export function formatOptionGroupOptionsCount(count: number): string {
  if (count === 1) return "1 opção";
  return `${count} opções`;
}
