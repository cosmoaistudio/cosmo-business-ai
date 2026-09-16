import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { beginCriticalOperation, endCriticalOperation } from "@/desktop/criticalOperation";
import type { DigitalOrderMode } from "../types/digitalStore.types";
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
import { buildMinimumOrderError, digitalOrderingService } from "../services/digitalOrdering.service";
import { fetchPublicComboDefinition } from "../repository/publicCombo.repository";
import type { PaymentMethod } from "@/features/pdv/types/sale";
import type { DigitalMenuProduct } from "@/features/product-engine/integrations/digitalMenu.adapter";
import type { AddCartItemInput } from "@/features/pdv/types/cart";
import { digitalCartUnitPrice } from "@/features/products/utils/productDigitalPromo";

interface DigitalOrderingExperienceProps {
  mode: DigitalOrderMode;
  tableLabel?: string;
}

export default function DigitalOrderingExperience({
  mode,
  tableLabel,
}: DigitalOrderingExperienceProps) {
  const navigate = useNavigate();
  const { store, context, cart } = useDigitalOrderingContext();
  const { products, loading } = useDigitalMenu(store?.organizationId ?? null, store?.slug);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [comboProductId, setComboProductId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

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

  if (!store) {
    return (
      <DigitalOrderingLayout store={null}>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
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
    cart.cancelEditItem();
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
    cart.addCartItem({
      ...toDigitalCartInput(input),
      replaceItemId: input.replaceItemId ?? cart.editingItemId ?? undefined,
      engineChannel: "delivery",
    });
    toast.success("Item adicionado ao carrinho.");
    handleCloseSheets();
  }

  const handleConfirmOrder = async () => {
    if (cart.items.length === 0) return;

    if (store.minimumOrder > 0 && cart.summary.subtotal < store.minimumOrder) {
      toast.error(buildMinimumOrderError(store.minimumOrder));
      return;
    }

    setSubmitting(true);
    beginCriticalOperation(
      "digital-checkout",
      "Há um pedido sendo processado. Aguarde concluir antes de atualizar."
    );
    try {
      const orderContext = {
        ...context,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        deliveryAddress:
          mode === "delivery" ? deliveryAddress.trim() || undefined : undefined,
      };

      const { order } = await digitalOrderingService.placeOrder({
        items: cart.items,
        paymentMethod,
        paymentAmount: cart.summary.total,
        discount: cart.summary.discount,
        couponCode: cart.coupon?.code ?? null,
        observation: cart.observation,
        organizationId: store.organizationId,
        storeSlug: store.slug,
        context: orderContext,
      });

      cart.clearCart();
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
      <DigitalStoreHeader store={store} mode={mode} tableLabel={tableLabel} />
      <CosmoDigitalMenu
        products={products}
        loading={loading}
        store={store}
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
        onAddToCart={(result) => {
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
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
        onUpdateQuantity={cart.updateQuantity}
        onRemove={cart.removeItem}
        onDuplicate={cart.duplicateItem}
        onEdit={(itemId) => {
          const item = cart.items.find((entry) => entry.id === itemId);
          if (!item) return;
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
        onObservationChange={cart.setObservation}
      />

      <DigitalCheckoutSheet
        open={checkoutOpen}
        total={cart.summary.total}
        subtotal={cart.summary.subtotal}
        minimumOrder={store.minimumOrder}
        deliveryFee={cart.summary.deliveryFee}
        loading={submitting}
        paymentMethod={paymentMethod}
        customerName={customerName}
        customerPhone={customerPhone}
        deliveryAddress={deliveryAddress}
        showDeliveryFields={mode === "delivery"}
        couponCode={cart.coupon?.code ?? null}
        onClose={() => setCheckoutOpen(false)}
        onConfirm={handleConfirmOrder}
        onPaymentChange={setPaymentMethod}
        onCustomerNameChange={setCustomerName}
        onCustomerPhoneChange={setCustomerPhone}
        onDeliveryAddressChange={setDeliveryAddress}
        onApplyCoupon={cart.applyCoupon}
        onRemoveCoupon={cart.removeCoupon}
      />
    </DigitalOrderingLayout>
  );
}
