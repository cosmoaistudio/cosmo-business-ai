import { useCallback, useMemo, useRef, useState } from "react";
import { useCriticalOperation } from "@/desktop/useCriticalOperation";
import type { Product } from "@/features/products/types/product";
import type {
  AddCartItemInput,
  CartItem,
  CartSummary,
} from "@/features/pdv/types/cart";
import { buildComboUnitSignatureKeys } from "@/features/pdv/utils/comboCartUnits";
import { buildCartItemSignature } from "@/features/pdv/utils/compositionPricing";
import type { DigitalCoupon } from "../types/digitalOrdering.types";
import { digitalOrderingService } from "../services/digitalOrdering.service";

function buildSummary(
  items: CartItem[],
  discount: number,
  deliveryFee: number
): CartSummary & { deliveryFee: number; couponDiscount: number } {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const safeDiscount = Math.min(Math.max(discount, 0), subtotal);
  const total = digitalOrderingService.calculateTotal(
    subtotal,
    safeDiscount,
    deliveryFee
  );

  return {
    itemCount,
    subtotal,
    discount: safeDiscount,
    total,
    deliveryFee,
    couponDiscount: safeDiscount,
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

function itemSignature(item: {
  productId: string;
  selectedOptions: CartItem["selectedOptions"];
  observation: string;
  comboComponents?: CartItem["comboComponents"];
}) {
  const quantities: Record<string, number> = {};
  for (const option of item.selectedOptions) {
    quantities[option.optionId] = Math.max(1, option.quantity ?? 1);
  }

  return buildCartItemSignature({
    productId: item.productId,
    selectedOptionIds: item.selectedOptions.map((option) => option.optionId),
    selectedOptionQuantities: quantities,
    observation: item.observation,
    comboComponentKeys: buildComboUnitSignatureKeys(item.comboComponents),
  });
}

export function useDigitalCart(deliveryFee = 0) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [observation, setObservation] = useState("");
  const [coupon, setCoupon] = useState<DigitalCoupon | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const editingItemIdRef = useRef<string | null>(null);

  const summary = useMemo(
    () => buildSummary(items, discount, deliveryFee),
    [items, discount, deliveryFee]
  );

  useCriticalOperation(
    "digital-cart",
    items.length > 0,
    "Há um pedido em andamento. Finalize ou cancele o carrinho antes de atualizar."
  );

  const setEditing = useCallback((itemId: string | null) => {
    editingItemIdRef.current = itemId;
    setEditingItemId(itemId);
  }, []);

  const addProduct = useCallback((product: Product) => {
    const isCombo = product.menu_kind === "combo";
    if (product.status !== "active") return;
    if (!isCombo && product.stock <= 0) return;
    setItems((current) => [...current, createSimpleCartItem(product)]);
  }, []);

  const addCartItem = useCallback(
    (input: AddCartItemInput) => {
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
          if (exists) {
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
                    engineChannel: input.engineChannel ?? "delivery",
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
            engineChannel: input.engineChannel ?? "delivery",
            comboComponents,
          },
        ];
      });

      setEditing(null);
    },
    [setEditing]
  );

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((item) => item.id !== itemId);
      }

      return current.map((item) => {
        if (item.id !== itemId) return item;
        const isCombo =
          item.product.menu_kind === "combo" ||
          (item.comboComponents?.length ?? 0) > 0;
        const nextQty = isCombo
          ? quantity
          : Math.min(quantity, item.product.stock);
        return { ...item, quantity: nextQty };
      });
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  }, []);

  const duplicateItem = useCallback((itemId: string) => {
    setItems((current) => {
      const source = current.find((item) => item.id === itemId);
      if (!source) return current;

      return [
        ...current,
        {
          ...source,
          id: crypto.randomUUID(),
        },
      ];
    });
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

  const applyCoupon = useCallback(
    (code: string) => {
      const result = digitalOrderingService.validateCoupon(code, summary.subtotal);
      if (!result.valid) {
        return { success: false as const, error: result.error };
      }

      setCoupon(result.coupon);
      setDiscount(result.discount);
      return { success: true as const, coupon: result.coupon };
    },
    [summary.subtotal]
  );

  const removeCoupon = useCallback(() => {
    setCoupon(null);
    setDiscount(0);
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
    setObservation("");
    setCoupon(null);
    setEditing(null);
  }, [setEditing]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const hasDuplicateSignature = useCallback(
    (
      productId: string,
      optionIds: string[],
      note: string,
      comboComponents?: CartItem["comboComponents"]
    ) => {
      const signature = itemSignature({
        productId,
        selectedOptions: optionIds.map((optionId) => ({
          optionId,
          optionName: optionId,
          groupId: "",
          groupName: "",
          quantity: 1,
          price: 0,
        })),
        observation: note,
        comboComponents,
      });
      return items.some(
        (item) =>
          itemSignature({
            productId: item.product.id,
            selectedOptions: item.selectedOptions,
            observation: item.observation,
            comboComponents: item.comboComponents,
          }) === signature
      );
    },
    [items]
  );

  return {
    items,
    summary,
    discount,
    observation,
    coupon,
    editingItemId,
    itemCount,
    addProduct,
    addCartItem,
    updateQuantity,
    removeItem,
    duplicateItem,
    startEditItem,
    cancelEditItem,
    getEditingItem,
    applyCoupon,
    removeCoupon,
    clearCart,
    setObservation,
    hasDuplicateSignature,
  };
}
