import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { beginCriticalOperation, endCriticalOperation } from "@/desktop/criticalOperation";
import type { DigitalOrderMode } from "../types/digitalStore.types";
import type { DigitalDeliveryAddress } from "../types/digitalOrdering.types";
import { useDigitalOrderingContext } from "../context/DigitalOrderingContext";
import { useDigitalMenu } from "../hooks/useDigitalMenu";
import DigitalOrderingLayout from "./DigitalOrderingLayout";
import DigitalStoreHeader from "./DigitalStoreHeader";
import CosmoDigitalMenu from "../menu/components/CosmoDigitalMenu";
import MenuCartBar from "../menu/components/MenuCartBar";
import { useMenuTheme } from "../menu/hooks/useMenuTheme";
import DigitalProductSheet from "./DigitalProductSheet";
import DigitalComboSheet from "./DigitalComboSheet";
import DigitalCartDrawer from "./DigitalCartDrawer";
import DigitalCheckoutSheet from "./DigitalCheckoutSheet";
import DigitalChannelSwitcher from "./DigitalChannelSwitcher";
import { buildMinimumOrderError, digitalOrderingService } from "../services/digitalOrdering.service";
import { fetchPublicComboDefinition } from "../repository/publicCombo.repository";
import { shouldShowFulfillmentSelector } from "../utils/checkoutFulfillment";
import {
  cartItemsMissingOnChannel,
  filterCatalogForChannel,
} from "../utils/digitalMenuChannels";
import {
  EMPTY_DELIVERY_ADDRESS,
  isDeliveryAddressComplete,
  sanitizeDeliveryAddressForContext,
  validateDeliveryAddress,
  type DeliveryAddressErrors,
} from "../utils/deliveryAddress";
import type { PaymentMethod } from "@/features/pdv/types/sale";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { AddCartItemInput } from "@/features/pdv/types/cart";
import { digitalCartUnitPrice } from "@/features/products/utils/productDigitalPromo";
import {
  applyIsolatedCartAction,
  buildPreviewOrderContext,
  checkoutTotalsForPreview,
  shouldIsolatePreviewMutations,
} from "../menu/theme/previewOrderContext";

interface DigitalOrderingExperienceProps {
  /** Route-level mode hint; effective mode always comes from context. */
  mode?: DigitalOrderMode;
  tableLabel?: string;
  /**
   * Admin live preview: browse/cart/checkout UI works, but place_order is blocked.
   * Does not change public checkout/cart behaviour when false/omitted.
   */
  previewMode?: boolean;
  /** Optional product list for embedded preview (skips remote reload flicker). */
  previewProducts?: DigitalMenuProduct[];
  /** Compact layout for phone/desktop preview frames. */
  embedded?: boolean;
  /**
   * Editor-only: force-open a demo sheet/checkout without persisting products.
   * Ignored when previewMode is false.
   */
  previewInspect?: "productsheet" | "checkout" | null;
  /** Editor preview canvas — section nav must scroll this, not the window. */
  scrollContainerRef?: RefObject<HTMLElement | null>;
}

export default function DigitalOrderingExperience({
  tableLabel,
  previewMode = false,
  previewProducts,
  embedded = false,
  previewInspect = null,
  scrollContainerRef,
}: DigitalOrderingExperienceProps) {
  const navigate = useNavigate();
  const {
    store,
    context,
    cart,
    allowFulfillmentChoice,
    fulfillmentOptions,
    setFulfillmentMode,
  } = useDigitalOrderingContext();
  const mode = context.mode;
  const { products: catalogProducts, loading, error: menuError } = useDigitalMenu(
    previewMode && previewProducts ? null : store?.organizationId ?? null,
    previewMode && previewProducts ? undefined : store?.slug
  );

  const sourceProducts = previewProducts ?? catalogProducts;

  const products = useMemo(
    () => filterCatalogForChannel(sourceProducts, mode),
    [sourceProducts, mode]
  );

  const unavailableCartProductIds = useMemo(
    () =>
      cartItemsMissingOnChannel(
        cart.items.map((item) => item.product.id),
        sourceProducts,
        mode
      ),
    [cart.items, sourceProducts, mode]
  );

  const unavailableCartItemIds = useMemo(() => {
    const blocked = new Set(unavailableCartProductIds);
    return cart.items
      .filter((item) => blocked.has(item.product.id))
      .map((item) => item.id);
  }, [cart.items, unavailableCartProductIds]);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [comboProductId, setComboProductId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [cashTendered, setCashTendered] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] =
    useState<DigitalDeliveryAddress>(EMPTY_DELIVERY_ADDRESS);
  const [deliveryAddressErrors, setDeliveryAddressErrors] =
    useState<DeliveryAddressErrors>({});
  const [addressTouched, setAddressTouched] = useState(false);

  useEffect(() => {
    if (mode !== "delivery") {
      setDeliveryAddressErrors({});
      setAddressTouched(false);
    }
  }, [mode]);

  const selectedMenuProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  const comboMenuProduct = useMemo(
    () => products.find((product) => product.id === comboProductId) ?? null,
    [products, comboProductId]
  );

  // Called before the early return so hook order stays stable.
  const { config: menuConfig, theme: menuTheme } = useMenuTheme(store);

  const editingItem = cart.getEditingItem();

  const deliveryConfirmBlocked =
    mode === "delivery" && !isDeliveryAddressComplete(deliveryAddress);
  const channelConfirmBlocked = unavailableCartItemIds.length > 0;
  const confirmDisabled = deliveryConfirmBlocked || channelConfirmBlocked;
  const inspectRef = useRef(previewInspect);
  const isolateInspect = shouldIsolatePreviewMutations(previewMode, previewInspect);
  const previewOrder = useMemo(
    () => buildPreviewOrderContext(products, store),
    [products, store]
  );
  const checkoutTotals = checkoutTotalsForPreview(
    previewInspect,
    previewOrder,
    cart.summary
  );
  const [inspectCustomerName, setInspectCustomerName] = useState("Cliente");
  const [inspectCustomerPhone, setInspectCustomerPhone] = useState("");
  const [inspectPaymentMethod, setInspectPaymentMethod] =
    useState<PaymentMethod>("pix");
  const [inspectCashTendered, setInspectCashTendered] = useState("");
  const [inspectAddress, setInspectAddress] =
    useState<DigitalDeliveryAddress>(EMPTY_DELIVERY_ADDRESS);

  useEffect(() => {
    if (!previewMode) return;
    const previousInspect = inspectRef.current;
    inspectRef.current = previewInspect;

    if (previewInspect === "checkout") {
      setSelectedProductId(null);
      setComboProductId(null);
      setCartOpen(false);
      setCheckoutOpen(true);
      return;
    }
    if (previewInspect === "productsheet") {
      setCheckoutOpen(false);
      const first = products[0];
      if (!first) {
        setSelectedProductId(null);
        setComboProductId(null);
        return;
      }
      if (first.menuKind === "combo" || (first.comboSlots?.length ?? 0) > 0) {
        setComboProductId(first.id);
        setSelectedProductId(null);
        return;
      }
      setSelectedProductId(first.id);
      setComboProductId(null);
      return;
    }
    if (previousInspect) {
      setCheckoutOpen(false);
      setSelectedProductId(null);
      setComboProductId(null);
    }
  }, [previewMode, previewInspect, products]);

  if (!store) {
    return (
      <DigitalOrderingLayout store={null}>
        <div
          className="border p-10 text-center"
          style={{
            borderRadius: "20px",
            borderColor: menuTheme.borderColor,
            backgroundColor: menuTheme.surfaceColor,
            color: menuTheme.mutedTextColor,
            fontFamily: menuTheme.fontFamily,
          }}
        >
          Loja não encontrada. Configure o Pedido Digital nas configurações.
        </div>
      </DigitalOrderingLayout>
    );
  }

  const storeSlug = store.slug;

  async function openProduct(product: DigitalMenuProduct) {
    const looksLikeCombo =
      product.menuKind === "combo" || (product.comboSlots?.length ?? 0) > 0;

    if (looksLikeCombo) {
      setComboProductId(product.id);
      setSelectedProductId(null);
      return;
    }

    // Snapshot antigo sem menuKind: tenta definição pública de combo
    if (product.groups.length === 0) {
      try {
        await fetchPublicComboDefinition(storeSlug, product.id);
        setComboProductId(product.id);
        setSelectedProductId(null);
        return;
      } catch {
        // não é combo — segue sheet simples
      }
    }

    setSelectedProductId(product.id);
    setComboProductId(null);
  }

  function handleCloseSheets() {
    setSelectedProductId(null);
    setComboProductId(null);
    applyIsolatedCartAction(isolateInspect, () => cart.cancelEditItem(), undefined);
  }

  function toDigitalCartInput(input: AddCartItemInput): AddCartItemInput {
    const isCombo =
      input.product.menu_kind === "combo" ||
      (input.comboComponents?.length ?? 0) > 0;
    if (isCombo) return input;

    return {
      ...input,
      unitPrice: digitalCartUnitPrice(input.product, input.unitPrice),
    };
  }

  function handleAddConfigured(input: AddCartItemInput) {
    if (isolateInspect) {
      handleCloseSheets();
      return;
    }
    cart.addCartItem({
      ...toDigitalCartInput(input),
      replaceItemId: input.replaceItemId ?? cart.editingItemId ?? undefined,
      engineChannel: "delivery",
    });
    toast.success("Item adicionado ao carrinho.");
    handleCloseSheets();
  }

  function handleDeliveryAddressChange(next: DigitalDeliveryAddress) {
    setDeliveryAddress(next);
    if (addressTouched) {
      setDeliveryAddressErrors(validateDeliveryAddress(next));
    }
  }

  function removeUnavailableCartItems() {
    for (const itemId of unavailableCartItemIds) {
      cart.removeItem(itemId);
    }
    toast.success("Itens indisponíveis removidos do carrinho.");
  }

  const handleConfirmOrder = async () => {
    if (cart.items.length === 0) return;

    if (previewMode) {
      toast.message("Modo preview: pedido não é enviado.");
      setCheckoutOpen(false);
      return;
    }

    if (store.minimumOrder > 0 && cart.summary.subtotal < store.minimumOrder) {
      toast.error(buildMinimumOrderError(store.minimumOrder));
      return;
    }

    if (unavailableCartItemIds.length > 0) {
      toast.error(
        "Alguns itens do carrinho não estão disponíveis neste canal. Remova-os para continuar."
      );
      setCheckoutOpen(false);
      setCartOpen(true);
      return;
    }

    if (mode === "delivery") {
      setAddressTouched(true);
      const errors = validateDeliveryAddress(deliveryAddress);
      setDeliveryAddressErrors(errors);
      if (Object.keys(errors).length > 0) {
        toast.error("Preencha o endereço de entrega completo.");
        return;
      }
    }

    const orderTotal = cart.summary.total;
    let paymentAmount = orderTotal;
    if (paymentMethod === "cash" && cashTendered.trim().length > 0) {
      const tendered = Number(cashTendered.replace(",", "."));
      if (!Number.isFinite(tendered) || tendered < orderTotal) {
        toast.error("Informe um valor de troco maior ou igual ao total.");
        return;
      }
      paymentAmount = tendered;
    }

    setSubmitting(true);
    beginCriticalOperation(
      "digital-checkout",
      "Há um pedido sendo processado. Aguarde concluir antes de atualizar."
    );
    try {
      const orderContext = {
        ...context,
        mode,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        deliveryAddress:
          mode === "delivery"
            ? sanitizeDeliveryAddressForContext(deliveryAddress)
            : undefined,
      };

      const { order } = await digitalOrderingService.placeOrder({
        items: cart.items,
        paymentMethod,
        paymentAmount,
        discount: cart.summary.discount,
        couponCode: cart.coupon?.code ?? null,
        observation: cart.observation,
        organizationId: store.organizationId,
        storeSlug: store.slug,
        context: orderContext,
      });

      cart.clearCart();
      setCashTendered("");
      setCheckoutOpen(false);
      toast.success(`Pedido #${order.saleNumber} recebido!`);
      navigate(`/order-status/${order.id}?store=${encodeURIComponent(store.slug)}`);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível finalizar o pedido. Tente novamente."
      );
    } finally {
      endCriticalOperation("digital-checkout");
      setSubmitting(false);
    }
  };

  return (
    <DigitalOrderingLayout
      store={store}
      embedded={embedded}
      footer={
        <MenuCartBar
          itemCount={cart.itemCount}
          total={cart.summary.total}
          label={menuConfig.copy.viewCartLabel}
          theme={menuTheme}
          onOpenCart={() => setCartOpen(true)}
        />
      }
    >
      {previewMode ? (
        <div
          className="mb-3 rounded-xl px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{
            backgroundColor: menuTheme.surfaceMuted,
            color: menuTheme.mutedTextColor,
            border: `1px solid ${menuTheme.borderColor}`,
          }}
        >
          Preview — pedidos não são enviados
        </div>
      ) : null}

      <DigitalStoreHeader store={store} mode={mode} tableLabel={tableLabel} />

      {allowFulfillmentChoice &&
      setFulfillmentMode &&
      fulfillmentOptions.length > 1 ? (
        <DigitalChannelSwitcher
          options={fulfillmentOptions}
          selected={mode === "delivery" || mode === "pickup" ? mode : null}
          onChange={setFulfillmentMode}
          theme={menuTheme}
        />
      ) : null}

      <CosmoDigitalMenu
        products={products}
        loading={previewProducts ? false : loading}
        store={store}
        error={previewProducts ? null : menuError}
        manageSeo={!previewMode}
        scrollContainerRef={scrollContainerRef}
        onSelectProduct={(productId) => {
          const product = products.find((entry) => entry.id === productId);
          if (!product) return;
          void openProduct(product);
        }}
      />

      <DigitalProductSheet
        productId={selectedProductId}
        menuProduct={selectedMenuProduct}
        open={selectedProductId != null && selectedMenuProduct?.menuKind !== "combo"}
        onClose={handleCloseSheets}
        theme={menuTheme}
        onAddToCart={(result) => {
          if (isolateInspect) {
            handleCloseSheets();
            return;
          }
          if (result.valid && result.cartInput) {
            cart.addCartItem({
              ...toDigitalCartInput(result.cartInput),
              replaceItemId: cart.editingItemId ?? undefined,
              engineChannel: "delivery",
            });
            handleCloseSheets();
          }
        }}
      />

      <DigitalComboSheet
        menuProduct={comboMenuProduct}
        storeSlug={store.slug}
        open={comboProductId != null}
        editingItem={
          editingItem?.product.id === comboProductId ? editingItem : null
        }
        onClose={handleCloseSheets}
        onConfirm={handleAddConfigured}
        theme={menuTheme}
      />

      <DigitalCartDrawer
        open={cartOpen}
        items={cart.items}
        itemCount={cart.itemCount}
        subtotal={cart.summary.subtotal}
        total={cart.summary.total}
        deliveryFee={cart.summary.deliveryFee}
        discount={cart.summary.discount}
        observation={cart.observation}
        unavailableItemIds={unavailableCartItemIds}
        onRemoveUnavailable={removeUnavailableCartItems}
        onClose={() => setCartOpen(false)}
        theme={menuTheme}
        onCheckout={() => {
          if (unavailableCartItemIds.length > 0) {
            toast.error(
              "Remova os itens indisponíveis neste canal antes de finalizar."
            );
            return;
          }
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
        onUpdateQuantity={
          isolateInspect ? () => undefined : cart.updateQuantity
        }
        onRemove={isolateInspect ? () => undefined : cart.removeItem}
        onDuplicate={isolateInspect ? () => undefined : cart.duplicateItem}
        onEdit={(itemId) => {
          if (isolateInspect) return;
          const item = cart.items.find((entry) => entry.id === itemId);
          if (!item) return;
          if (unavailableCartItemIds.includes(itemId)) {
            toast.error("Este item não está disponível no canal atual.");
            return;
          }
          cart.startEditItem(itemId);
          setCartOpen(false);
          if (
            item.product.menu_kind === "combo" ||
            (item.comboComponents?.length ?? 0) > 0
          ) {
            setComboProductId(item.product.id);
            setSelectedProductId(null);
            return;
          }
          setSelectedProductId(item.product.id);
          setComboProductId(null);
        }}
        onObservationChange={
          isolateInspect ? () => undefined : cart.setObservation
        }
      />

      <DigitalCheckoutSheet
        open={checkoutOpen}
        total={checkoutTotals.total}
        subtotal={checkoutTotals.subtotal}
        minimumOrder={isolateInspect ? 0 : store.minimumOrder}
        deliveryFee={checkoutTotals.deliveryFee}
        loading={submitting}
        paymentMethod={isolateInspect ? inspectPaymentMethod : paymentMethod}
        customerName={isolateInspect ? inspectCustomerName : customerName}
        customerPhone={isolateInspect ? inspectCustomerPhone : customerPhone}
        cashTendered={isolateInspect ? inspectCashTendered : cashTendered}
        deliveryAddress={isolateInspect ? inspectAddress : deliveryAddress}
        deliveryAddressErrors={
          isolateInspect
            ? {}
            : mode === "delivery" && checkoutOpen
              ? validateDeliveryAddress(deliveryAddress)
              : deliveryAddressErrors
        }
        showDeliveryFields={isolateInspect ? false : mode === "delivery"}
        tableLabel={mode === "dine_in" ? tableLabel ?? context.tableLabel ?? null : null}
        fulfillmentOptions={fulfillmentOptions}
        selectedFulfillment={
          mode === "delivery" || mode === "pickup" ? mode : null
        }
        showFulfillmentSelector={
          !isolateInspect &&
          shouldShowFulfillmentSelector(allowFulfillmentChoice, fulfillmentOptions)
        }
        couponCode={isolateInspect ? null : cart.coupon?.code ?? null}
        confirmDisabled={isolateInspect ? true : confirmDisabled}
        previewOrder={
          isolateInspect && previewInspect === "checkout" ? previewOrder : null
        }
        onClose={() => setCheckoutOpen(false)}
        onConfirm={handleConfirmOrder}
        theme={menuTheme}
        onPaymentChange={(method) => {
          if (isolateInspect) {
            setInspectPaymentMethod(method);
            if (method !== "cash") setInspectCashTendered("");
            return;
          }
          setPaymentMethod(method);
          if (method !== "cash") setCashTendered("");
        }}
        onCustomerNameChange={
          isolateInspect ? setInspectCustomerName : setCustomerName
        }
        onCustomerPhoneChange={
          isolateInspect ? setInspectCustomerPhone : setCustomerPhone
        }
        onCashTenderedChange={
          isolateInspect ? setInspectCashTendered : setCashTendered
        }
        onDeliveryAddressChange={
          isolateInspect ? setInspectAddress : handleDeliveryAddressChange
        }
        onFulfillmentChange={
          isolateInspect ? undefined : setFulfillmentMode ?? undefined
        }
        onApplyCoupon={
          isolateInspect
            ? () => ({ success: false, error: "Preview — cupom não aplicado." })
            : cart.applyCoupon
        }
        onRemoveCoupon={isolateInspect ? () => undefined : cart.removeCoupon}
      />
    </DigitalOrderingLayout>
  );
}
