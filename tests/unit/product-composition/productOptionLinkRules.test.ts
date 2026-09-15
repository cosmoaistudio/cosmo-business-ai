import { describe, expect, it } from "vitest";
import {
  canLinkOptionGroup,
  filterUnlinkedOptionGroups,
  formatOptionGroupOptionsCount,
  formatOptionGroupSelectionRule,
  isPendingLinkId,
  makePendingLinkId,
  makePendingProductOptionLink,
  pendingGroupIdFromLinkId,
} from "@/features/product-composition/utils/productOptionLinkRules";
import type { OptionGroup } from "@/features/product-composition/types/optionGroup";

function group(partial: Partial<OptionGroup> & Pick<OptionGroup, "id" | "name">): OptionGroup {
  return {
    organization_id: "org",
    description: null,
    selection_type: "checkbox",
    min_selection: 0,
    max_selection: 2,
    required: false,
    sort_order: 0,
    created_at: "",
    updated_at: "",
    ...partial,
  };
}

describe("productOptionLinkRules", () => {
  it("gera e detecta link pendente", () => {
    const id = makePendingLinkId("g1");
    expect(isPendingLinkId(id)).toBe(true);
    expect(pendingGroupIdFromLinkId(id)).toBe("g1");
    expect(isPendingLinkId("real-uuid")).toBe(false);
  });

  it("cria vínculo local sem product_id", () => {
    const g = group({ id: "g1", name: "Frutas" });
    const link = makePendingProductOptionLink(g, 0, 3);
    expect(link.id).toBe("pending:g1");
    expect(link.product_id).toBe("");
    expect(link.group_id).toBe("g1");
    expect(link.option_groups?.name).toBe("Frutas");
  });

  it("previne duplicação de vínculo", () => {
    expect(canLinkOptionGroup("g1", ["g1"]).ok).toBe(false);
    expect(canLinkOptionGroup("", []).ok).toBe(false);
    expect(canLinkOptionGroup("g2", ["g1"]).ok).toBe(true);
  });

  it("filtra grupos já vinculados", () => {
    const all = [
      group({ id: "a", name: "A" }),
      group({ id: "b", name: "B" }),
    ];
    expect(filterUnlinkedOptionGroups(all, ["a"]).map((g) => g.id)).toEqual([
      "b",
    ]);
  });

  it("formata regra de seleção e contagem", () => {
    expect(
      formatOptionGroupSelectionRule({
        min_selection: 0,
        max_selection: 2,
        required: false,
      })
    ).toBe("Cliente escolhe até 2");
    expect(
      formatOptionGroupSelectionRule({
        min_selection: 1,
        max_selection: 1,
        required: true,
      })
    ).toBe("Cliente escolhe 1");
    expect(formatOptionGroupOptionsCount(1)).toBe("1 opção");
    expect(formatOptionGroupOptionsCount(3)).toBe("3 opções");
  });
});
