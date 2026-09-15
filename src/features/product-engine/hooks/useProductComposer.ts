import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/features/products/types/product";
import type { CartItem } from "@/features/pdv/types/cart";
import { productValidator } from "../engines/ProductValidator";
import { productRulesEngine } from "../engines/ProductRulesEngine";
import { productPricingEngine } from "../engines/ProductPricingEngine";
import { loadEngineProductNode } from "../repository/productEngine.repository";
import {
  adjustEngineOptionQuantity,
  confirmComposerSelection,
  loadComposerNode,
  selectionsToEngineState,
  toggleEngineSelection,
} from "../integrations/cart.adapter";
import type {
  EngineBuildState,
  EngineProductNode,
  EngineSelectionItem,
} from "../types/productEngine.types";

export type ComposerInitialState = {
  quantity?: number;
  observation?: string;
  selectedOptions?: CartItem["selectedOptions"];
};

export type ComposerLoadOptions = {
  /** Quando presente, não chama o repositório autenticado (pedido digital / anon). */
  preloadedNode?: EngineProductNode | null;
};

function seedSelectionsFromOptions(
  node: EngineProductNode,
  selectedOptions: CartItem["selectedOptions"]
) {
  const next: Record<string, EngineSelectionItem[]> = {};
  for (const selected of selectedOptions) {
    const group = node.groups.find((g) =>
      (node.optionsByGroupId[g.id] ?? []).some((o) => o.id === selected.optionId)
    );
    if (!group) continue;
    const option = node.optionsByGroupId[group.id]?.find(
      (o) => o.id === selected.optionId
    );
    if (!option) continue;
    const list = next[group.id] ?? [];
    list.push({
      groupId: group.id,
      groupName: group.name,
      optionId: option.id,
      optionName: option.name,
      quantity: Math.max(1, selected.quantity || 1),
      unitPrice: option.price,
      premium: group.type === "premium" || option.premium,
    });
    next[group.id] = list;
  }
  return next;
}

export function useProductComposer(
  product: Product | null,
  initial?: ComposerInitialState | null,
  loadOptions?: ComposerLoadOptions | null
) {
  const initialRef = useRef(initial);
  initialRef.current = initial;
  const preloadedNode = loadOptions?.preloadedNode ?? null;

  const [loading, setLoading] = useState(false);
  const [node, setNode] = useState<EngineProductNode | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [selections, setSelections] = useState<
    Record<string, EngineSelectionItem[]>
  >({});
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState("");

  const productId = product?.id ?? null;

  const load = useCallback(async () => {
    if (!productId || !product) return;

    setLoading(true);
    try {
      let resultNode: EngineProductNode | null = null;
      let nextBlocked = false;
      let nextBlockedReason: string | null = null;

      if (preloadedNode && preloadedNode.productId === productId) {
        resultNode = preloadedNode;
      } else {
        const result = await loadComposerNode(productId, loadEngineProductNode);
        resultNode = result.node;
        nextBlocked = result.blocked;
        nextBlockedReason = result.blockedReason ?? null;
      }

      setNode(resultNode);
      setBlocked(nextBlocked);
      setBlockedReason(nextBlockedReason);

      const seed = initialRef.current;
      if (seed?.selectedOptions?.length && resultNode) {
        setSelections(seedSelectionsFromOptions(resultNode, seed.selectedOptions));
      } else {
        setSelections({});
      }

      setQuantity(Math.max(1, seed?.quantity ?? 1));
      setObservation(seed?.observation ?? "");
    } finally {
      setLoading(false);
    }
  }, [product, productId, preloadedNode]);

  useEffect(() => {
    void load();
  }, [load]);

  const buildState = useMemo((): EngineBuildState | null => {
    if (!product) return null;
    return selectionsToEngineState(product.id, selections, observation);
  }, [product, selections, observation]);

  const validation = useMemo(() => {
    if (!node || !buildState) return null;
    const fieldValidation = productValidator.validateBuildState(node, buildState);
    const rules = productRulesEngine.evaluate(node, buildState.selections);
    return {
      valid: fieldValidation.valid && rules.valid,
      errors: [...fieldValidation.errors, ...rules.errors],
      warnings: fieldValidation.warnings,
    };
  }, [node, buildState]);

  const pricing = useMemo(() => {
    if (!node || !buildState) return null;
    return productPricingEngine.calculate(
      node,
      buildState.selections,
      quantity
    );
  }, [node, buildState, quantity]);

  const toggleOption = useCallback(
    (groupId: string, optionId: string) => {
      if (!node || !buildState) return;
      const next = toggleEngineSelection(node, buildState, groupId, optionId);
      setSelections(next.selections);
    },
    [node, buildState]
  );

  const setOptionQuantity = useCallback(
    (groupId: string, optionId: string, nextQuantity: number) => {
      if (!node || !buildState) return;
      const next = adjustEngineOptionQuantity(
        node,
        buildState,
        groupId,
        optionId,
        nextQuantity
      );
      setSelections(next.selections);
    },
    [node, buildState]
  );

  const confirm = useCallback(
    (channel: "pdv" | "mobile" | "delivery" = "pdv") => {
      if (!product || !node || !buildState) {
        return { valid: false, errors: ["Produto não carregado."] };
      }

      return confirmComposerSelection({
        product,
        node,
        state: buildState,
        quantity,
        channel,
      });
    },
    [product, node, buildState, quantity]
  );

  return {
    loading,
    node,
    blocked,
    blockedReason,
    selections,
    quantity,
    observation,
    validation,
    pricing,
    setQuantity,
    setObservation,
    toggleOption,
    setOptionQuantity,
    confirm,
    reload: load,
  };
}
