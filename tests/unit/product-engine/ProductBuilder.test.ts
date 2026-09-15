import { describe, expect, it } from "vitest";
import {
  buildBuilderCartPayload,
  removeBuilderOption,
  selectBuilderOption,
} from "@/features/product-engine/core/productBuilderCore";
import {
  createCompositeProductNode,
  createInitialBuildState,
  OPTION_SIZE_G,
  OPTION_SIZE_M,
  SIZE_GROUP_ID,
  validCompositeSelections,
  selection,
} from "../../fixtures/productEngine";

describe("ProductBuilder (core)", () => {
  it("seleciona opção radio substituindo anterior", () => {
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

    state = selectBuilderOption(
      node,
      state,
      SIZE_GROUP_ID,
      selection({
        groupId: SIZE_GROUP_ID,
        groupName: "Tamanho",
        optionId: OPTION_SIZE_G,
        optionName: "Grande",
        unitPrice: 5,
      })
    );

    expect(state.selections[SIZE_GROUP_ID]).toHaveLength(1);
    expect(state.selections[SIZE_GROUP_ID]?.[0]?.optionId).toBe(OPTION_SIZE_G);
  });

  it("remove opção do grupo", () => {
    const state = {
      ...createInitialBuildState("prod-composite"),
      selections: validCompositeSelections(),
    };

    const next = removeBuilderOption(state, SIZE_GROUP_ID, OPTION_SIZE_M);
    expect(next.selections[SIZE_GROUP_ID]).toHaveLength(0);
  });

  it("gera payload de carrinho quando válido", () => {
    const node = createCompositeProductNode();
    const state = {
      ...createInitialBuildState(node.productId),
      selections: validCompositeSelections(),
    };

    const result = buildBuilderCartPayload(node, state, "pdv", 1);
    expect(result.valid).toBe(true);
    expect(result.cartPayload?.productId).toBe("prod-composite");
    expect(result.cartPayload?.unitPrice).toBe(27);
    expect(result.cartPayload?.selectedOptions.length).toBe(2);
  });

  it("retorna inválido quando falta grupo obrigatório", () => {
    const node = createCompositeProductNode();
    const state = createInitialBuildState(node.productId);
    const result = buildBuilderCartPayload(node, state, "pdv");

    expect(result.valid).toBe(false);
    expect(result.validation.errors.length).toBeGreaterThan(0);
    expect(result.cartPayload).toBeUndefined();
  });

  it("ignora seleção em grupo inexistente", () => {
    const node = createCompositeProductNode();
    const state = createInitialBuildState(node.productId);
    const next = selectBuilderOption(
      node,
      state,
      "invalid-group",
      selection({
        groupId: "invalid-group",
        optionId: "x",
        optionName: "X",
      })
    );
    expect(next).toEqual(state);
  });
});
