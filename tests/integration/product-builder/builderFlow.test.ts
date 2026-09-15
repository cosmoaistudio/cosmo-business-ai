import { describe, expect, it } from "vitest";
import {
  buildBuilderCartPayload,
  selectBuilderOption,
} from "@/features/product-engine/core/productBuilderCore";
import {
  createCompositeProductNode,
  createInitialBuildState,
  OPTION_SIZE_M,
  SIZE_GROUP_ID,
  validCompositeSelections,
  selection,
} from "../../fixtures/productEngine";

describe("Product Builder — fluxo integrado", () => {
  it("monta produto composto passo a passo", () => {
    const node = createCompositeProductNode();
    let state = createInitialBuildState(node.productId);

    state = selectBuilderOption(
      node,
      state,
      SIZE_GROUP_ID,
      selection({
        groupId: SIZE_GROUP_ID,
        groupName: "Tamanho",
        optionId: OPTION_SIZE_M,
        optionName: "Médio",
      })
    );

    for (const [groupId, items] of Object.entries(validCompositeSelections())) {
      if (groupId === SIZE_GROUP_ID) continue;
      for (const item of items) {
        state = selectBuilderOption(node, state, groupId, item);
      }
    }

    const result = buildBuilderCartPayload(node, state, "pdv");
    expect(result.valid).toBe(true);
    expect(result.pricing.total).toBeGreaterThan(0);
    expect(result.cartPayload?.selectedOptions.length).toBe(2);
  });

  it("preview reflete validação antes de salvar", () => {
    const node = createCompositeProductNode();
    const incomplete = buildBuilderCartPayload(
      node,
      createInitialBuildState(node.productId),
      "pdv"
    );
    expect(incomplete.valid).toBe(false);

    const complete = buildBuilderCartPayload(node, {
      ...createInitialBuildState(node.productId),
      selections: validCompositeSelections(),
    }, "pdv");
    expect(complete.valid).toBe(true);
  });
});
