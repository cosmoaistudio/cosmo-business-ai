import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  adjustEngineOptionQuantity,
  confirmComposerSelection,
  selectionsToEngineState,
  toggleEngineSelection,
} from "@/features/product-engine/integrations/cart.adapter";
import { filterComposerNode } from "@/features/product-engine/utils/availabilityFilter";
import { productPricingEngine } from "@/features/product-engine/engines/ProductPricingEngine";
import { productValidator } from "@/features/product-engine/engines/ProductValidator";
import { buildCartItemSignature } from "@/features/pdv/utils/compositionPricing";
import {
  createCompositeProductNode,
  createInitialBuildState,
  OPTION_SAUCE_BB,
  OPTION_SAUCE_CH,
  OPTION_SIZE_G,
  OPTION_SIZE_M,
  SAUCE_GROUP_ID,
  SIZE_GROUP_ID,
} from "../../fixtures/productEngine";
import { createProduct as createCartProduct } from "../../fixtures/cart";

describe("Motor de composição — auditoria funcional", () => {
  describe("Regras min/max", () => {
    it("min 0 / max 1: seleção única e remoção", () => {
      const node = createCompositeProductNode({
        groups: createCompositeProductNode().groups.map((g) =>
          g.id === SAUCE_GROUP_ID
            ? {
                ...g,
                minSelection: 0,
                maxSelection: 1,
                selectionType: "radio",
                required: false,
              }
            : g
        ),
      });
      let state = createInitialBuildState(node.productId);
      state = adjustEngineOptionQuantity(
        node,
        state,
        SAUCE_GROUP_ID,
        OPTION_SAUCE_BB,
        1
      );
      expect(state.selections[SAUCE_GROUP_ID]).toHaveLength(1);

      state = adjustEngineOptionQuantity(
        node,
        state,
        SAUCE_GROUP_ID,
        OPTION_SAUCE_BB,
        0
      );
      expect(state.selections[SAUCE_GROUP_ID] ?? []).toHaveLength(0);
    });

    it("min 1 / max 1: valida obrigatório", () => {
      const node = createCompositeProductNode();
      const empty = createInitialBuildState(node.productId);
      const invalid = productValidator.validateBuildState(node, empty);
      expect(invalid.valid).toBe(false);

      let state = empty;
      state = adjustEngineOptionQuantity(
        node,
        state,
        SIZE_GROUP_ID,
        OPTION_SIZE_M,
        1
      );
      // still missing nothing if sauce optional — size ok
      const withSize = productValidator.validateGroup(
        node.groups.find((g) => g.id === SIZE_GROUP_ID)!,
        node.optionsByGroupId[SIZE_GROUP_ID],
        state.selections[SIZE_GROUP_ID]
      );
      expect(withSize.valid).toBe(true);
    });

    it("min 0 / max 3: impede ultrapassar total de quantidades", () => {
      const node = createCompositeProductNode({
        groups: createCompositeProductNode().groups.map((g) =>
          g.id === SAUCE_GROUP_ID
            ? {
                ...g,
                minSelection: 0,
                maxSelection: 3,
                allowsQuantity: true,
                selectionType: "checkbox",
              }
            : g
        ),
      });

      let state = createInitialBuildState(node.productId);
      state = adjustEngineOptionQuantity(
        node,
        state,
        SAUCE_GROUP_ID,
        OPTION_SAUCE_BB,
        3
      );
      expect(state.selections[SAUCE_GROUP_ID]?.[0]?.quantity).toBe(3);

      // 4th unit must clamp / ignore
      state = adjustEngineOptionQuantity(
        node,
        state,
        SAUCE_GROUP_ID,
        OPTION_SAUCE_BB,
        4
      );
      expect(state.selections[SAUCE_GROUP_ID]?.[0]?.quantity).toBe(3);

      // another option when already at max stays blocked
      const blocked = adjustEngineOptionQuantity(
        node,
        state,
        SAUCE_GROUP_ID,
        OPTION_SAUCE_CH,
        1
      );
      expect(blocked.selections[SAUCE_GROUP_ID]).toHaveLength(1);
    });

    it("min 1 / max 3: rejeita confirmação abaixo do mínimo", () => {
      const node = createCompositeProductNode({
        groups: createCompositeProductNode().groups.map((g) =>
          g.id === SAUCE_GROUP_ID
            ? {
                ...g,
                minSelection: 1,
                maxSelection: 3,
                required: true,
                selectionType: "checkbox",
              }
            : g
        ),
      });

      let state = createInitialBuildState(node.productId);
      state = adjustEngineOptionQuantity(
        node,
        state,
        SIZE_GROUP_ID,
        OPTION_SIZE_M,
        1
      );

      const product = createCartProduct({
        id: node.productId,
        price: node.basePrice,
      });
      const result = confirmComposerSelection({
        product,
        node,
        state,
        quantity: 1,
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("Preço em tempo real", () => {
    it("14.90 + Morango 6 + Leite 4.50 = 25.40", () => {
      const node = createCompositeProductNode({
        basePrice: 14.9,
        optionsByGroupId: {
          ...createCompositeProductNode().optionsByGroupId,
          [SAUCE_GROUP_ID]: [
            {
              ...createCompositeProductNode().optionsByGroupId[SAUCE_GROUP_ID][0],
              id: "opt-morango",
              name: "Morango",
              price: 6,
            },
            {
              ...createCompositeProductNode().optionsByGroupId[SAUCE_GROUP_ID][1],
              id: "opt-leite",
              name: "Leite em pó",
              price: 4.5,
            },
          ],
        },
      });

      const selections = {
        [SIZE_GROUP_ID]: [
          {
            groupId: SIZE_GROUP_ID,
            groupName: "Tamanho",
            optionId: OPTION_SIZE_M,
            optionName: "Médio",
            quantity: 1,
            unitPrice: 0,
            premium: false,
          },
        ],
        [SAUCE_GROUP_ID]: [
          {
            groupId: SAUCE_GROUP_ID,
            groupName: "Molho",
            optionId: "opt-morango",
            optionName: "Morango",
            quantity: 1,
            unitPrice: 6,
            premium: false,
          },
          {
            groupId: SAUCE_GROUP_ID,
            groupName: "Molho",
            optionId: "opt-leite",
            optionName: "Leite em pó",
            quantity: 1,
            unitPrice: 4.5,
            premium: false,
          },
        ],
      };

      const pricing = productPricingEngine.calculate(node, selections, 1);
      expect(pricing.total).toBeCloseTo(25.4, 2);

      const qty2 = productPricingEngine.calculate(node, selections, 2);
      expect(qty2.total).toBeCloseTo(50.8, 2);
    });
  });

  describe("Opção pausada", () => {
    it("mantém opção visível e não permite seleção", () => {
      const raw = createCompositeProductNode({
        optionsByGroupId: {
          ...createCompositeProductNode().optionsByGroupId,
          [SAUCE_GROUP_ID]: [
            {
              ...createCompositeProductNode().optionsByGroupId[SAUCE_GROUP_ID][0],
              active: false,
              name: "Morango",
            },
            createCompositeProductNode().optionsByGroupId[SAUCE_GROUP_ID][1],
          ],
        },
      });

      const { node } = filterComposerNode(raw);
      const paused = node.optionsByGroupId[SAUCE_GROUP_ID].find(
        (o) => o.name === "Morango"
      );
      expect(paused).toBeTruthy();
      expect(paused?.active).toBe(false);

      const state = createInitialBuildState(node.productId);
      const next = adjustEngineOptionQuantity(
        node,
        state,
        SAUCE_GROUP_ID,
        paused!.id,
        1
      );
      expect(next.selections[SAUCE_GROUP_ID] ?? []).toHaveLength(0);
    });
  });

  describe("Produto pausado", () => {
    it("bloqueia confirmação no PDV", () => {
      const node = createCompositeProductNode({ status: "inactive" });
      const state = {
        ...createInitialBuildState(node.productId),
        selections: {
          [SIZE_GROUP_ID]: [
            {
              groupId: SIZE_GROUP_ID,
              groupName: "Tamanho",
              optionId: OPTION_SIZE_M,
              optionName: "Médio",
              quantity: 1,
              unitPrice: 0,
              premium: false,
            },
          ],
        },
      };
      const product = createCartProduct({
        id: node.productId,
        price: node.basePrice,
        status: "inactive",
      });
      const result = confirmComposerSelection({
        product,
        node,
        state,
        quantity: 1,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.join(" ")).toMatch(/pausado/i);
    });
  });

  describe("Carrinho: itens iguais com opções diferentes", () => {
    it("assinatura diferencia Morango vs Banana", () => {
      const a = buildCartItemSignature({
        productId: "acai-500",
        selectedOptionIds: ["morango"],
        observation: "",
      });
      const b = buildCartItemSignature({
        productId: "acai-500",
        selectedOptionIds: ["banana"],
        observation: "",
      });
      expect(a).not.toBe(b);
    });

    it("assinatura diferencia quantidade do adicional", () => {
      const one = buildCartItemSignature({
        productId: "acai-500",
        selectedOptionIds: ["morango"],
        selectedOptionQuantities: { morango: 1 },
        observation: "",
      });
      const two = buildCartItemSignature({
        productId: "acai-500",
        selectedOptionIds: ["morango"],
        selectedOptionQuantities: { morango: 2 },
        observation: "",
      });
      expect(one).not.toBe(two);
    });

    it("editar um item não altera o outro", async () => {
      const { useCart } = await import("@/features/pdv/hooks/useCart");
      const { result } = renderHook(() => useCart());
      const product = createCartProduct({
        id: "acai-500",
        name: "Açaí 500ml",
        price: 14.9,
        stock: 50,
      });

      act(() => {
        result.current.addCartItem({
          product,
          quantity: 1,
          unitPrice: 20.9,
          selectedOptions: [
            {
              optionId: "morango",
              optionName: "Morango",
              groupId: "frutas",
              groupName: "Frutas",
              price: 6,
              quantity: 1,
            },
          ],
        });
        result.current.addCartItem({
          product,
          quantity: 1,
          unitPrice: 19.9,
          selectedOptions: [
            {
              optionId: "banana",
              optionName: "Banana",
              groupId: "frutas",
              groupName: "Frutas",
              price: 5,
              quantity: 1,
            },
          ],
        });
      });

      expect(result.current.items).toHaveLength(2);
      const bananaId = result.current.items[1].id;

      act(() => {
        result.current.startEditItem(bananaId);
        result.current.addCartItem({
          product,
          quantity: 1,
          unitPrice: 18.9,
          replaceItemId: bananaId,
          selectedOptions: [
            {
              optionId: "kiwi",
              optionName: "Kiwi",
              groupId: "frutas",
              groupName: "Frutas",
              price: 4,
              quantity: 1,
            },
          ],
        });
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].selectedOptions[0].optionName).toBe(
        "Morango"
      );
      expect(result.current.items[1].selectedOptions[0].optionName).toBe("Kiwi");
      expect(result.current.items[1].unitPrice).toBe(18.9);
    });

    it("produto simples sem composição entra direto", async () => {
      const { useCart } = await import("@/features/pdv/hooks/useCart");
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addProduct(
          createCartProduct({ name: "Água", price: 3, stock: 10 })
        );
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].selectedOptions).toHaveLength(0);
      expect(result.current.summary.total).toBe(3);
    });

    it("clearCart zera edição em andamento", async () => {
      const { useCart } = await import("@/features/pdv/hooks/useCart");
      const { result } = renderHook(() => useCart());
      const product = createCartProduct({ stock: 10 });

      act(() => {
        result.current.addProduct(product);
      });
      const id = result.current.items[0].id;
      act(() => {
        result.current.startEditItem(id);
        result.current.clearCart();
      });
      expect(result.current.editingItemId).toBeNull();
      expect(result.current.items).toHaveLength(0);
    });
  });

  describe("Toggle quantidade negativa", () => {
    it("não permite quantidade negativa (remove no 0)", () => {
      const node = createCompositeProductNode({
        groups: createCompositeProductNode().groups.map((g) =>
          g.id === SAUCE_GROUP_ID
            ? { ...g, allowsQuantity: true, maxSelection: 5 }
            : g
        ),
      });
      let state = createInitialBuildState(node.productId);
      state = adjustEngineOptionQuantity(
        node,
        state,
        SAUCE_GROUP_ID,
        OPTION_SAUCE_BB,
        2
      );
      state = adjustEngineOptionQuantity(
        node,
        state,
        SAUCE_GROUP_ID,
        OPTION_SAUCE_BB,
        -5
      );
      expect(state.selections[SAUCE_GROUP_ID] ?? []).toHaveLength(0);
    });
  });

  describe("Busca / seleção / remoção no estado", () => {
    it("toggle remove opção em grupo checkbox sem repeat", () => {
      const node = createCompositeProductNode();
      let state = createInitialBuildState(node.productId);
      state = toggleEngineSelection(
        node,
        state,
        SAUCE_GROUP_ID,
        OPTION_SAUCE_BB
      );
      expect(state.selections[SAUCE_GROUP_ID]).toHaveLength(1);
      state = toggleEngineSelection(
        node,
        state,
        SAUCE_GROUP_ID,
        OPTION_SAUCE_BB
      );
      expect(state.selections[SAUCE_GROUP_ID] ?? []).toHaveLength(0);
    });

    it("selectionsToEngineState preserva observação", () => {
      const state = selectionsToEngineState(
        "p1",
        {},
        "sem granola"
      );
      expect(state.observation).toBe("sem granola");
    });
  });
});

describe("compositionAdminService — duplicação segura", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("deepCopy cria novos group_ids (cópia independente)", async () => {
    const createOptionGroup = vi.fn(async (payload: { name: string }) => ({
      id: `new-group-${payload.name}`,
      ...payload,
    }));
    const createOption = vi.fn(async (payload: { name: string }) => ({
      id: `new-opt-${payload.name}`,
      ...payload,
    }));
    const createProductOptionGroup = vi.fn(async () => ({}));
    const createProductMock = vi.fn(async (payload: { name: string }) => ({
      id: "prod-copy",
      ...payload,
    }));
    const getProductById = vi.fn(async () =>
      createCartProduct({
        id: "prod-a",
        name: "Açaí 500ml",
        price: 14.9,
        category: "Açaí",
        description: "Creme",
        stock: 10,
        min_stock: 1,
        status: "active",
      })
    );
    const getProductOptionGroupsByProductId = vi.fn(async () => [
      { group_id: "grp-frutas", sort_order: 0 },
    ]);
    const getOptionGroupById = vi.fn(async () => ({
      id: "grp-frutas",
      name: "Frutas",
      description: null,
      selection_type: "checkbox",
      min_selection: 0,
      max_selection: 3,
      required: false,
      sort_order: 0,
    }));
    const getOptionsByGroupId = vi.fn(async () => [
      {
        id: "opt-morango",
        group_id: "grp-frutas",
        name: "Morango",
        description: null,
        price: 6,
        stock_control: false,
        stock: 0,
        image_url: null,
        active: true,
        sort_order: 0,
      },
    ]);

    vi.doMock("@/features/products/repository/products.repository", () => ({
      createProduct: createProductMock,
      getProductById,
      updateProduct: vi.fn(),
    }));
    vi.doMock(
      "@/features/product-composition/repository/optionGroups.repository",
      () => ({
        createOptionGroup,
        getOptionGroupById,
      })
    );
    vi.doMock(
      "@/features/product-composition/repository/options.repository",
      () => ({
        createOption,
        getOptionById: vi.fn(),
        getOptionsByGroupId,
      })
    );
    vi.doMock(
      "@/features/product-composition/repository/productOptionGroups.repository",
      () => ({
        createProductOptionGroup,
        deleteProductOptionGroupsByProductId: vi.fn(),
        getProductOptionGroupsByProductId,
      })
    );
    vi.doMock("@/config/supabase", () => ({
      supabase: { rpc: vi.fn(), from: vi.fn() },
    }));

    const { compositionAdminService } = await import(
      "@/features/product-composition/services/compositionAdmin.service"
    );

    await compositionAdminService.duplicateProduct({
      sourceProductId: "prod-a",
      mode: "independent",
      name: "Açaí 700ml",
    });

    expect(createProductMock).toHaveBeenCalled();
    expect(createOptionGroup).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Frutas", max_selection: 3 })
    );
    expect(createOption).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Morango",
        price: 6,
        group_id: "new-group-Frutas",
      })
    );
    expect(createProductOptionGroup).toHaveBeenCalledWith(
      expect.objectContaining({
        product_id: "prod-copy",
        group_id: "new-group-Frutas",
      })
    );
  });

  it("shared mode apenas vincula o mesmo group_id", async () => {
    const createOptionGroup = vi.fn();
    const createProductOptionGroup = vi.fn(async () => ({}));
    const createProductMock = vi.fn(async (payload: { name: string }) => ({
      id: "prod-shared",
      ...payload,
    }));

    vi.doMock("@/features/products/repository/products.repository", () => ({
      createProduct: createProductMock,
      getProductById: vi.fn(async () =>
        createCartProduct({
          id: "prod-a",
          name: "Açaí 500ml",
          price: 14.9,
          category: "Açaí",
          description: "",
          stock: 10,
          min_stock: 0,
          status: "active",
        })
      ),
      updateProduct: vi.fn(),
    }));
    vi.doMock(
      "@/features/product-composition/repository/optionGroups.repository",
      () => ({
        createOptionGroup,
        getOptionGroupById: vi.fn(),
      })
    );
    vi.doMock(
      "@/features/product-composition/repository/options.repository",
      () => ({
        createOption: vi.fn(),
        getOptionById: vi.fn(),
        getOptionsByGroupId: vi.fn(),
      })
    );
    vi.doMock(
      "@/features/product-composition/repository/productOptionGroups.repository",
      () => ({
        createProductOptionGroup,
        deleteProductOptionGroupsByProductId: vi.fn(),
        getProductOptionGroupsByProductId: vi.fn(async () => [
          { group_id: "grp-frutas", sort_order: 1 },
        ]),
      })
    );
    vi.doMock("@/config/supabase", () => ({
      supabase: { rpc: vi.fn(), from: vi.fn() },
    }));

    const { compositionAdminService } = await import(
      "@/features/product-composition/services/compositionAdmin.service"
    );

    await compositionAdminService.duplicateProduct({
      sourceProductId: "prod-a",
      mode: "shared",
      name: "Açaí 700ml",
    });

    expect(createOptionGroup).not.toHaveBeenCalled();
    expect(createProductOptionGroup).toHaveBeenCalledWith(
      expect.objectContaining({
        product_id: "prod-shared",
        group_id: "grp-frutas",
      })
    );
  });
});
