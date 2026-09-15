import { useCallback, useMemo, useRef, useState } from "react";
import { useCriticalOperation } from "@/desktop/useCriticalOperation";
import type { Product } from "@/features/products";
import type {
  AddCartItemInput,
  CartItem,
  CartSummary,
} from "../types/cart";
import { buildComboUnitSignatureKeys } from "../utils/comboCartUnits";
import { buildCartItemSignature } from "../utils/compositionPricing";

function buildSummary(items: CartItem[], discount: number): CartSummary {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const safeDiscount = Math.min(Math.max(discount, 0), subtotal);

  return {
    itemCount,
    subtotal,
    discount: safeDiscount,
    total: subtotal - safeDiscount,
  };
}

function createSimpleCartItem(product: Product): CartItem {
  return {
    id: crypto.randomUUID(),
    product,
    quantity: 1,
    unitPrice: Number(product.price),
    selectedOptions: [],
    observation: "",
  };
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [observation, setObservation] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const editingItemIdRef = useRef<string | null>(null);

  const summary = useMemo(
    () => buildSummary(items, discount),
    [items, discount]
  );

  useCriticalOperation(
    "pdv-cart",
    items.length > 0,
    "Há uma venda em andamento. Finalize ou cancele o carrinho antes de atualizar."
  );

  const setEditing = useCallback((itemId: string | null) => {
    editingItemIdRef.current = itemId;
    setEditingItemId(itemId);
  }, []);

  const itemSignature = useCallback((item: {
    productId: string;
    selectedOptions: CartItem["selectedOptions"];
    observation: string;
    comboComponents?: CartItem["comboComponents"];
  }) => {
    const quantities: Record<string, number> = {};
    for (const option of item.selectedOptions) {
      quantities[option.optionId] = Math.max(1, option.quantity ?? 1);
    }

    const comboComponentKeys = buildComboUnitSignatureKeys(
      item.comboComponents
    );

    return buildCartItemSignature({
      productId: item.productId,
      selectedOptionIds: item.selectedOptions.map((option) => option.optionId),
      selectedOptionQuantities: quantities,
      observation: item.observation,
      comboComponentKeys,
    });
  }, []);

  const addProduct = useCallback((product: Product) => {
    const isCombo = product.menu_kind === "combo";
    if (product.status !== "active") return;
    if (!isCombo && product.stock <= 0) return;

    setItems((current) => {
      const signature = itemSignature({
        productId: product.id,
        selectedOptions: [],
        observation: "",
      });

      const existing = current.find(
        (item) =>
          itemSignature({
            productId: item.product.id,
            selectedOptions: item.selectedOptions,
            observation: item.observation,
          }) === signature
      );

      if (existing) {
        if (existing.quantity >= product.stock) return current;

        return current.map((item) =>
          item.id === existing.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, createSimpleCartItem(product)];
    });
  }, [itemSignature]);

  const addCartItem = useCallback((input: AddCartItemInput) => {
    const product = input.product;
    const isCombo =
      product.menu_kind === "combo" ||
      (input.comboComponents?.length ?? 0) > 0;
    if (product.status !== "active") return;
    if (!isCombo && product.stock <= 0) return;

    const quantity = Math.max(1, input.quantity);
    if (!isCombo && quantity > product.stock) return;

    setItems((current) => {
      const editingId = input.replaceItemId ?? editingItemIdRef.current;
      const comboComponents = input.comboComponents;

      if (editingId) {
        const exists = current.some((item) => item.id === editingId);
        if (!exists) {
          // Fall through to append if the edited line disappeared.
        } else {
          return current.map((item) =>
            item.id === editingId
              ? {
                  id: item.id,
                  product,
                  quantity,
                  unitPrice: input.unitPrice,
                  selectedOptions: input.selectedOptions ?? [],
                  observation: input.observation?.trim() ?? "",
                  summaries: input.summaries,
                  engineChannel: input.engineChannel,
                  comboComponents,
                }
              : item
          );
        }
      }

      const selectedOptions = input.selectedOptions ?? [];
      const signature = itemSignature({
        productId: product.id,
        selectedOptions,
        observation: input.observation ?? "",
        comboComponents,
      });

      const existing = current.find(
        (item) =>
          itemSignature({
            productId: item.product.id,
            selectedOptions: item.selectedOptions,
            observation: item.observation,
            comboComponents: item.comboComponents,
          }) === signature
      );

      if (existing) {
        const nextQuantity = isCombo
          ? existing.quantity + quantity
          : Math.min(existing.quantity + quantity, product.stock);

        return current.map((item) =>
          item.id === existing.id ? { ...item, quantity: nextQuantity } : item
        );
      }

      return [
        ...current,
        {
          id: crypto.randomUUID(),
          product,
          quantity,
          unitPrice: input.unitPrice,
          selectedOptions,
          observation: input.observation?.trim() ?? "",
          summaries: input.summaries,
          engineChannel: input.engineChannel,
          comboComponents,
        },
      ];
    });

    setEditing(null);
  }, [itemSignature, setEditing]);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((item) => item.id !== itemId);
      }

      return current.map((item) => {
        if (item.id !== itemId) return item;

        const cappedQuantity = Math.min(quantity, item.product.stock);

        return { ...item, quantity: cappedQuantity };
      });
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
    setObservation("");
    setEditing(null);
  }, [setEditing]);

  const updateObservation = useCallback((value: string) => {
    setObservation(value);
  }, []);

  const updateDiscount = useCallback((value: number) => {
    setDiscount(Math.max(value, 0));
  }, []);

  const startEditItem = useCallback(
    (itemId: string) => {
      setEditing(itemId);
    },
    [setEditing]
  );

  const cancelEditItem = useCallback(() => {
    setEditing(null);
  }, [setEditing]);

  const getEditingItem = useCallback(() => {
    if (!editingItemId) return null;
    return items.find((item) => item.id === editingItemId) ?? null;
  }, [editingItemId, items]);

  return {
    items,
    summary,
    discount,
    observation,
    editingItemId,
    addProduct,
    addCartItem,
    updateQuantity,
    removeItem,
    clearCart,
    updateDiscount,
    updateObservation,
    startEditItem,
    cancelEditItem,
    getEditingItem,
  };
}
