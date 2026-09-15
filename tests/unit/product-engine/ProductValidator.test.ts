import { describe, expect, it } from "vitest";
import { productValidator } from "@/features/product-engine/engines/ProductValidator";
import {
  createCompositeProductNode,
  createInitialBuildState,
  createOutOfStockNode,
  createPausedOptionNode,
  createSimpleProductNode,
  OPTION_SAUCE_BB,
  SAUCE_GROUP_ID,
  SIZE_GROUP_ID,
  validCompositeSelections,
  selection,
  OPTION_SIZE_M,
} from "../../fixtures/productEngine";
import { expectInvalidResult, expectValidResult } from "../../helpers/testUtils";

describe("ProductValidator", () => {
  it("valida produto simples sem grupos", () => {
    const node = createSimpleProductNode();
    const result = productValidator.validateBuildState(
      node,
      createInitialBuildState(node.productId)
    );
    expectValidResult(result);
  });

  it("exige seleção em grupo obrigatório", () => {
    const node = createCompositeProductNode();
    const result = productValidator.validateBuildState(
      node,
      createInitialBuildState(node.productId)
    );
    expectInvalidResult(result, "Tamanho");
  });

  it("aceita seleções válidas em produto composto", () => {
    const node = createCompositeProductNode();
    const state = {
      ...createInitialBuildState(node.productId),
      selections: validCompositeSelections(),
    };
    expectValidResult(productValidator.validateBuildState(node, state));
  });

  it("rejeita opção pausada", () => {
    const node = createPausedOptionNode();
    const state = {
      ...createInitialBuildState(node.productId),
      selections: {
        [SIZE_GROUP_ID]: [
          selection({
            groupId: SIZE_GROUP_ID,
            groupName: "Tamanho",
            optionId: OPTION_SIZE_M,
            optionName: "Médio",
          }),
        ],
        [SAUCE_GROUP_ID]: [
          selection({
            groupId: SAUCE_GROUP_ID,
            groupName: "Molho",
            optionId: OPTION_SAUCE_BB,
            optionName: "Barbecue",
            unitPrice: 2,
          }),
        ],
      },
    };
    expectInvalidResult(productValidator.validateBuildState(node, state), "indisponível");
  });

  it("rejeita estoque insuficiente", () => {
    const node = createOutOfStockNode();
    const state = {
      ...createInitialBuildState(node.productId),
      selections: {
        [SIZE_GROUP_ID]: [
          selection({
            groupId: SIZE_GROUP_ID,
            groupName: "Tamanho",
            optionId: OPTION_SIZE_M,
            optionName: "Médio",
            quantity: 2,
          }),
        ],
      },
    };
    expectInvalidResult(
      productValidator.validateBuildState(node, state),
      "Estoque insuficiente"
    );
  });

  it("rejeita produto pausado", () => {
    const node = createCompositeProductNode({ status: "inactive" });
    const state = {
      ...createInitialBuildState(node.productId),
      selections: validCompositeSelections(),
    };
    expectInvalidResult(productValidator.validateBuildState(node, state), "pausado");
  });

  it("emite aviso quando excede maxFree", () => {
    const node = createCompositeProductNode({
      groups: [
        {
          ...createCompositeProductNode().groups[1],
          maxFree: 1,
        },
        ...createCompositeProductNode().groups.slice(1),
      ],
    });
    const sauceGroup = node.groups.find((g) => g.id === SAUCE_GROUP_ID)!;
    node.groups = node.groups.map((g) =>
      g.id === SAUCE_GROUP_ID ? { ...sauceGroup, maxFree: 1 } : g
    );

    const state = {
      ...createInitialBuildState(node.productId),
      selections: {
        ...validCompositeSelections(),
        [SAUCE_GROUP_ID]: [
          ...validCompositeSelections()[SAUCE_GROUP_ID],
          selection({
            groupId: SAUCE_GROUP_ID,
            groupName: "Molho",
            optionId: "opt-sauce-ch",
            optionName: "Cheddar",
            unitPrice: 3,
          }),
        ],
      },
    };

    const result = productValidator.validateBuildState(node, state);
    expect(result.warnings.some((w) => w.includes("grátis"))).toBe(true);
  });

  it("rejeita grupo inativo com seleções", () => {
    const node = createCompositeProductNode();
    const group = { ...node.groups.find((g) => g.id === SIZE_GROUP_ID)!, active: false };
    const options = node.optionsByGroupId[SIZE_GROUP_ID] ?? [];

    const result = productValidator.validateGroup(group, options, [
      selection({
        groupId: SIZE_GROUP_ID,
        optionId: OPTION_SIZE_M,
        optionName: "Médio",
      }),
    ]);
    expectInvalidResult(result, "inativo");
  });

  it("rejeita múltiplas opções em grupo radio", () => {
    const node = createCompositeProductNode();
    const group = node.groups.find((g) => g.id === SIZE_GROUP_ID)!;
    const options = node.optionsByGroupId[SIZE_GROUP_ID] ?? [];

    const result = productValidator.validateGroup(group, options, [
      selection({
        groupId: SIZE_GROUP_ID,
        optionId: OPTION_SIZE_M,
        optionName: "Médio",
      }),
      selection({
        groupId: SIZE_GROUP_ID,
        optionId: "opt-size-g",
        optionName: "Grande",
      }),
    ]);
    expectInvalidResult(result, "apenas uma opção");
  });

  it("rejeita opções duplicadas quando não permite repetição", () => {
    const node = createCompositeProductNode();
    const group = { ...node.groups.find((g) => g.id === SAUCE_GROUP_ID)!, allowsRepeat: false };
    const options = node.optionsByGroupId[SAUCE_GROUP_ID] ?? [];

    const result = productValidator.validateGroup(group, options, [
      selection({
        groupId: SAUCE_GROUP_ID,
        optionId: OPTION_SAUCE_BB,
        optionName: "Barbecue",
      }),
      selection({
        groupId: SAUCE_GROUP_ID,
        optionId: OPTION_SAUCE_BB,
        optionName: "Barbecue",
      }),
    ]);
    expectInvalidResult(result, "duplicadas");
  });

  it("rejeita opção inválida no grupo", () => {
    const node = createCompositeProductNode();
    const group = node.groups.find((g) => g.id === SAUCE_GROUP_ID)!;
    const options = node.optionsByGroupId[SAUCE_GROUP_ID] ?? [];

    const result = productValidator.validateGroup(group, options, [
      selection({
        groupId: SAUCE_GROUP_ID,
        optionId: "opt-inexistente",
        optionName: "Fantasma",
      }),
    ]);
    expectInvalidResult(result, "inválida");
  });
});
