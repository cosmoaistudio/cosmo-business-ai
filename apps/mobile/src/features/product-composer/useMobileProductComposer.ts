import { useCallback, useEffect, useMemo, useState } from "react";
import type { Product } from "@/features/products/types/product";
import {
  confirmComposerSelection,
  loadComposerNode,
  selectionsToEngineState,
  toggleEngineSelection,
} from "@/features/product-engine/integrations/cart.adapter";
import { productValidator } from "@/features/product-engine/engines/ProductValidator";
import { productRulesEngine } from "@/features/product-engine/engines/ProductRulesEngine";
import { productPricingEngine } from "@/features/product-engine/engines/ProductPricingEngine";
import type {
  EngineBuildState,
  EngineProductNode,
  EngineSelectionItem,
} from "@/features/product-engine/types/productEngine.types";
import { loadMobileEngineProductNode } from "./repository/composer.repository";

export function useMobileProductComposer(product: Product | null) {
  const [loading, setLoading] = useState(false);
  const [node, setNode] = useState<EngineProductNode | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, EngineSelectionItem[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState("");

  const load = useCallback(async () => {
    if (!product) return;
    setLoading(true);
    try {
      const result = await loadComposerNode(product.id, loadMobileEngineProductNode);
      setNode(result.node);
      setBlocked(result.blocked);
      setBlockedReason(result.blockedReason ?? null);
      setSelections({});
      setQuantity(1);
      setObservation("");
    } finally {
      setLoading(false);
    }
  }, [product]);

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
    };
  }, [node, buildState]);

  const pricing = useMemo(() => {
    if (!node || !buildState) return null;
    return productPricingEngine.calculate(node, buildState.selections, quantity);
  }, [node, buildState, quantity]);

  const toggleOption = useCallback(
    (groupId: string, optionId: string) => {
      if (!node || !buildState) return;
      const next = toggleEngineSelection(node, buildState, groupId, optionId);
      setSelections(next.selections);
    },
    [node, buildState]
  );

  const confirm = useCallback(() => {
    if (!product || !node || !buildState) {
      return { valid: false, errors: ["Produto não carregado."] };
    }

    return confirmComposerSelection({
      product,
      node,
      state: buildState,
      quantity,
      channel: "mobile",
    });
  }, [product, node, buildState, quantity]);

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
    confirm,
    reload: load,
  };
}
